"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  clearAdminSession,
  getAccessToken,
  loadAdminGrades,
  loadAdminSubjects,
  type AdminGradeLevel,
  type AdminSubject,
} from "../auth/adminAuth";
import { ActionButtons } from "./components/ActionButtons";
import { CurriculumShell } from "./CurriculumShell";
import { Drawer, StatusPill } from "./Shared";

const topics = [
  {
    name: "Newton's Second Law",
    khmer: "ច្បាប់ទីពីររបស់ញូតុន",
    code: "PHY-10-01",
    subject: "Physics",
    grade: "Grade 10",
    difficulty: "Intermediate",
    objectives:
      "Explain how force, mass, and acceleration connect in real examples.",
    description:
      "Covers force diagrams, F = ma calculations, and applied motion problems.",
    status: "Active",
  },
  {
    name: "Quadratic Equations",
    khmer: "សមីការដឺក្រេទីពីរ",
    code: "MAT-11-04",
    subject: "Math",
    grade: "Grade 11",
    difficulty: "Advanced",
    objectives:
      "Solve quadratic equations by factoring, completing the square, and formula.",
    description:
      "Builds algebraic fluency through graph interpretation and equation solving.",
    status: "Active",
  },
  {
    name: "Balancing Equations",
    khmer: "ការថ្លឹងសមីការគីមី",
    code: "CHE-12-02",
    subject: "Chemistry",
    grade: "Grade 12",
    difficulty: "Beginner",
    objectives:
      "Balance chemical equations while preserving atom counts on both sides.",
    description:
      "Introduces coefficients, conservation of mass, and common reaction patterns.",
    status: "Draft",
  },
];

const difficulties = ["All Levels", "Beginner", "Intermediate", "Advanced"] as const;

const difficultyClasses: Record<string, string> = {
  Beginner: "bg-emerald-500/15 text-emerald-300",
  Intermediate: "bg-amber-500/15 text-amber-300",
  Advanced: "bg-rose-500/15 text-rose-300",
};

type Topic = (typeof topics)[number];
type TopicDrawerState =
  | { mode: "add"; topic?: undefined }
  | { mode: "edit" | "duplicate"; topic: Topic };

export function TopicsPage() {
  const router = useRouter();
  const [topicRows, setTopicRows] = useState<Topic[]>(topics);
  const [drawerState, setDrawerState] = useState<TopicDrawerState | null>(null);
  const [grades, setGrades] = useState<AdminGradeLevel[]>([]);
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [difficultyFilter, setDifficultyFilter] =
    useState<(typeof difficulties)[number]>("All Levels");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/auth/Login");
      return;
    }

    let isMounted = true;
    Promise.all([loadAdminGrades(), loadAdminSubjects()])
      .then(([loadedGrades, loadedSubjects]) => {
        if (!isMounted) return;
        setGrades(loadedGrades);
        setSubjects(loadedSubjects.filter((subject) => subject.status !== "Inactive"));
      })
      .catch((loadError) => {
        if (
          loadError instanceof Error &&
          (loadError.message.includes("Admin session") ||
            loadError.message.includes("Invalid or expired authentication token") ||
            loadError.message.includes("Admin access is required"))
        ) {
          clearAdminSession();
          router.replace("/auth/Login");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const gradeOptions = useMemo(() => grades.map((grade) => grade.name), [grades]);
  const subjectsByGrade = useMemo(() => {
    return subjects.reduce<Record<string, string[]>>((groupedSubjects, subject) => {
      if (!groupedSubjects[subject.grade]) groupedSubjects[subject.grade] = [];
      if (!groupedSubjects[subject.grade].includes(subject.name)) {
        groupedSubjects[subject.grade].push(subject.name);
      }
      return groupedSubjects;
    }, {});
  }, [subjects]);
  const subjectOptions = subjectsByGrade[selectedGrade] ?? [];

  useEffect(() => {
    if (!selectedGrade && gradeOptions.length) {
      setSelectedGrade(gradeOptions[0]);
      return;
    }

    if (selectedGrade && subjectOptions.length && !subjectOptions.includes(selectedSubject)) {
      setSelectedSubject(subjectOptions[0]);
    }
  }, [gradeOptions, selectedGrade, selectedSubject, subjectOptions]);

  const filteredTopics = useMemo(
    () =>
      topicRows.filter(
        (topic) =>
          topic.grade === selectedGrade &&
          topic.subject === selectedSubject &&
          (difficultyFilter === "All Levels" ||
            topic.difficulty === difficultyFilter),
      ),
    [difficultyFilter, selectedGrade, selectedSubject, topicRows],
  );

  function saveTopic(topic: Topic) {
    setTopicRows((currentTopics) => {
      if (drawerState?.mode === "edit") {
        return currentTopics.map((currentTopic) =>
          currentTopic.code === drawerState.topic.code ? topic : currentTopic,
        );
      }

      return [{ ...topic, code: topic.code || `TOP-${currentTopics.length + 1}` }, ...currentTopics];
    });
    setDrawerState(null);
    setPage(1);
  }

  function setTopicDraft(code: string) {
    setTopicRows((currentTopics) =>
      currentTopics.map((topic) =>
        topic.code === code ? { ...topic, status: "Draft" } : topic,
      ),
    );
  }

  return (
    <CurriculumShell
      active="Topics"
      title={`${selectedSubject} Topics`}
      subtitle={`Choose a grade and subject before adding topics for ${selectedGrade}.`}
      searchPlaceholder="Search topics, codes..."
      actionLabel="Add Topic"
      onAction={() => setDrawerState({ mode: "add" })}
    >
      <TopicFilters
        selectedGrade={selectedGrade}
        selectedSubject={selectedSubject}
        gradeOptions={gradeOptions}
        subjectOptions={subjectOptions}
        difficultyFilter={difficultyFilter}
        onSubjectChange={(value) => {
          setSelectedSubject(value);
          setPage(1);
        }}
        onGradeChange={(value) => {
          const nextSubjects =
            subjectsByGrade[value] ?? [];

          setSelectedGrade(value);
          setSelectedSubject(
            nextSubjects[0] ?? "",
          );
          setPage(1);
        }}
        onDifficultyChange={(value) => {
          setDifficultyFilter(value);
          setPage(1);
        }}
      />
      <TopicTable
        topics={filteredTopics}
        page={page}
        onPageChange={setPage}
        onEdit={(topic) => setDrawerState({ mode: "edit", topic })}
        onDuplicate={(topic) => setDrawerState({ mode: "duplicate", topic })}
        onDraft={setTopicDraft}
      />
      {drawerState && (
        <TopicModal
          state={drawerState}
          onClose={() => setDrawerState(null)}
          onSave={saveTopic}
          context={{
            grade: selectedGrade,
            subject: selectedSubject,
          }}
        />
      )}
    </CurriculumShell>
  );
}

function TopicFilters({
  selectedGrade,
  selectedSubject,
  gradeOptions,
  subjectOptions,
  difficultyFilter,
  onSubjectChange,
  onGradeChange,
  onDifficultyChange,
}: {
  selectedGrade: string;
  selectedSubject: string;
  gradeOptions: readonly string[];
  subjectOptions: readonly string[];
  difficultyFilter: (typeof difficulties)[number];
  onSubjectChange: (value: string) => void;
  onGradeChange: (value: string) => void;
  onDifficultyChange: (value: (typeof difficulties)[number]) => void;
}) {
  return (
    <section className="mb-6 grid gap-4 lg:grid-cols-3">
      <SelectField
        label="Grade Level"
        value={selectedGrade}
        options={gradeOptions}
        onChange={onGradeChange}
      />
      <SelectField
        label="Subject"
        value={selectedSubject}
        options={subjectOptions}
        onChange={onSubjectChange}
      />
      <SelectField
        label="Difficulty"
        value={difficultyFilter}
        options={difficulties}
        onChange={(value) =>
          onDifficultyChange(value as (typeof difficulties)[number])
        }
      />
    </section>
  );
}

function TopicTable({
  topics,
  page,
  onPageChange,
  onEdit,
  onDuplicate,
  onDraft,
}: {
  topics: Topic[];
  page: number;
  onPageChange: (page: number) => void;
  onEdit: (topic: Topic) => void;
  onDuplicate: (topic: Topic) => void;
  onDraft: (code: string) => void;
}) {
  const pageSize = 3;
  const totalPages = Math.max(1, Math.ceil(topics.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleTopics = topics.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <section className="overflow-hidden rounded-xl border border-[#243856] bg-[#0b1324] shadow-[0_18px_45px_rgba(0,0,0,0.2)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead className="bg-[#101a2b] text-xs uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4 font-extrabold">Topic Name</th>
              <th className="px-6 py-4 font-extrabold">Code</th>
              <th className="px-6 py-4 font-extrabold">Subject</th>
              <th className="px-6 py-4 font-extrabold">Grade</th>
              <th className="px-6 py-4 font-extrabold">Difficulty</th>
              <th className="px-6 py-4 font-extrabold">Status</th>
              <th className="px-6 py-4 text-right font-extrabold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#243856]">
            {visibleTopics.map((topic) => (
              <tr
                key={topic.code}
                className="text-sm transition hover:bg-[#101a2b]/55"
              >
                <td className="px-6 py-6">
                  <p className="font-bold text-white">{topic.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{topic.khmer}</p>
                </td>
                <td className="px-6 py-6">
                  <span className="font-bold text-[#1fc7e9]">{topic.code}</span>
                </td>
                <td className="px-6 py-6 font-semibold text-slate-300">
                  {topic.subject}
                </td>
                <td className="px-6 py-6 font-semibold text-slate-300">
                  {topic.grade}
                </td>
                <td className="px-6 py-6">
                  <DifficultyPill difficulty={topic.difficulty} />
                </td>
                <td className="px-6 py-6">
                  <StatusPill status={topic.status} />
                </td>
                <td className="px-6 py-6 text-right">
                  <ActionButtons
                    onEdit={() => onEdit(topic)}
                    onDuplicate={() => onDuplicate(topic)}
                    onDeactivate={() => onDraft(topic.code)}
                    deactivateLabel="Set draft"
                  />
                </td>
              </tr>
            ))}
            {visibleTopics.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm font-semibold text-slate-500">
                  No topics match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <TableFooter
        count={topics.length}
        page={safePage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </section>
  );
}

function TopicModal({
  state,
  onClose,
  onSave,
  context,
}: {
  state: TopicDrawerState;
  onClose: () => void;
  onSave: (topic: Topic) => void;
  context: {
    grade: string;
    subject: string;
  };
}) {
  const topic = state.topic;
  const isEditing = state.mode === "edit";
  const title =
    state.mode === "add"
      ? "Add New Topic"
      : state.mode === "duplicate"
        ? "Duplicate Topic"
        : "Edit Topic";
  const primaryLabel = isEditing ? "Update Topic" : "Save Topic";
  const grade =
    isEditing && topic
      ? topic.grade
      : context.grade;
  const subject =
    isEditing && topic
      ? topic.subject
      : context.subject;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextTopic: Topic = {
      name: String(formData.get("name") || "Untitled Topic"),
      khmer: topic?.khmer ?? "Curriculum topic",
      code: String(formData.get("code") || ""),
      subject,
      grade,
      difficulty: String(formData.get("difficulty") || "Beginner"),
      objectives: String(formData.get("objectives") || ""),
      description: String(formData.get("description") || ""),
      status: formData.get("status") ? "Active" : "Draft",
    };

    onSave(nextTopic);
  }

  return (
    <Drawer title={title} onClose={onClose}>
      <form
        id="topic-form"
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        <div className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <ReadOnlyField
              label="Grade Level"
              value={grade}
            />
            <ReadOnlyField
              label="Subject"
              value={subject}
            />
          </div>
          <NamedField
            name="name"
            label="Topic Name"
            placeholder="e.g. Newton's Second Law"
            defaultValue={
              state.mode === "duplicate" && topic ? `${topic.name} Copy` : topic?.name
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <NamedField
              name="code"
              label="Topic Code"
              placeholder="PHY-10-01"
              defaultValue={
                state.mode === "duplicate" && topic
                  ? `${topic.code}-COPY`
                  : topic?.code
              }
            />
            <NamedSelectField
              name="difficulty"
              label="Difficulty Level"
              value={topic?.difficulty ?? "Beginner"}
              options={difficulties.filter((difficulty) => difficulty !== "All Levels")}
            />
          </div>
          <NamedTextArea
            name="objectives"
            label="Learning Objectives"
            placeholder="What should students be able to do?"
            defaultValue={topic?.objectives}
          />
          <NamedTextArea
            name="description"
            label="Description"
            placeholder="Briefly describe the key focus areas..."
            defaultValue={topic?.description}
          />
          <NamedStatusToggle defaultChecked={topic?.status !== "Draft"} />
        </div>
        <TopicDrawerActions primaryLabel={primaryLabel} onClose={onClose} />
      </form>
    </Drawer>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8da7d8]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-lg border border-[#3b5d8f] bg-[#101a2b] px-4 text-sm font-medium text-slate-100 outline-none transition focus:border-[#6f7cff] focus:ring-2 focus:ring-[#5368ff]/20"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8da7d8]">
        {label}
      </span>
      <div className="flex h-12 items-center rounded-lg border border-[#3b5d8f] bg-[#101a2b] px-4 text-sm font-semibold text-cyan-300">
        {value}
      </div>
    </label>
  );
}

function NamedField({
  name,
  label,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8da7d8]">
        {label}
      </span>
      <input
        name={name}
        className="h-12 w-full rounded-lg border border-[#3b5d8f] bg-[#101a2b] px-4 text-sm font-medium text-slate-100 outline-none transition placeholder:text-slate-400/70 focus:border-[#6f7cff] focus:ring-2 focus:ring-[#5368ff]/20"
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
    </label>
  );
}

function NamedTextArea({
  name,
  label,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8da7d8]">
        {label}
      </span>
      <textarea
        name={name}
        className="min-h-28 w-full resize-none rounded-lg border border-[#3b5d8f] bg-[#101a2b] px-4 py-3 text-sm font-medium leading-6 text-slate-100 outline-none transition placeholder:text-slate-400/70 focus:border-[#6f7cff] focus:ring-2 focus:ring-[#5368ff]/20"
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
    </label>
  );
}

function NamedSelectField({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: readonly string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8da7d8]">
        {label}
      </span>
      <select
        name={name}
        defaultValue={value}
        className="h-12 w-full rounded-lg border border-[#3b5d8f] bg-[#101a2b] px-4 text-sm font-medium text-slate-100 outline-none transition focus:border-[#6f7cff] focus:ring-2 focus:ring-[#5368ff]/20"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function DifficultyPill({ difficulty }: { difficulty: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        difficultyClasses[difficulty] ?? difficultyClasses.Beginner
      }`}
    >
      {difficulty}
    </span>
  );
}

function NamedStatusToggle({ defaultChecked }: { defaultChecked: boolean }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-[#3b5d8f] bg-[#101a2b] p-4">
      <span>
        <span className="block text-sm font-semibold text-slate-50">Publish Status</span>
        <span className="text-xs font-medium text-slate-400">
          Visible to students and teachers
        </span>
      </span>
      <input
        name="status"
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-[#5368ff]"
      />
    </label>
  );
}

function TopicDrawerActions({
  primaryLabel,
  onClose,
}: {
  primaryLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="mt-auto grid grid-cols-2 gap-3 border-t border-[#243856] p-6">
      <button
        type="button"
        onClick={onClose}
        className="h-12 rounded-lg border border-[#3b5d8f] bg-[#101a2b] text-sm font-bold text-slate-100 transition hover:border-[#6f7cff] hover:bg-[#0b1324]"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="h-12 rounded-lg bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:brightness-110"
      >
        {primaryLabel}
      </button>
    </div>
  );
}

function TableFooter({
  count,
  page,
  totalPages,
  onPageChange,
}: {
  count: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4 border-t border-[#243856] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-semibold text-slate-600">
        Showing {count ? (page - 1) * 3 + 1 : 0}-{Math.min(page * 3, count)} of{" "}
        {count} topics
      </p>
      <div className="flex gap-2">
        <PageButton
          disabled={page === 1}
          label="Previous page"
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeftIcon />
        </PageButton>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
          <PageButton
            key={item}
            active={item === page}
            onClick={() => onPageChange(item)}
          >
            {item}
          </PageButton>
        ))}
        <PageButton
          disabled={page === totalPages}
          label="Next page"
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRightIcon />
        </PageButton>
      </div>
    </div>
  );
}

function PageButton({
  active,
  disabled,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  label?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-bold transition ${
        active
          ? "border-transparent bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-white"
          : "border-[#243856] bg-[#0b1324] text-slate-500 hover:border-[#5368ff] hover:text-white disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#243856] disabled:hover:text-slate-500"
      }`}
    >
      {children}
    </button>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
