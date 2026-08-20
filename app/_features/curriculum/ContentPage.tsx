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
  createAdminCurriculumContent,
  deleteAdminCurriculumContent,
  getAccessToken,
  loadAdminCurriculumContent,
  loadAdminGrades,
  loadAdminSubjects,
  loadAdminTopics,
  updateAdminCurriculumContent,
  type AdminCurriculumContent,
  type AdminCurriculumContentInput,
  type AdminCurriculumTopic,
  type AdminGradeLevel,
  type AdminSubject,
} from "../auth/adminAuth";
import { CurriculumShell } from "./CurriculumShell";
import { Drawer } from "./Shared";

/* =========================================================
   TYPES
========================================================= */

type FormulaStatus = "Published" | "Draft";
type ContentStatus = "Published" | "Draft";

type FormulaVariable = {
  id: string;
  symbol: string;
  meaning: string;
  unit: string;
};

type FormulaStep = {
  id: string;
  text: string;
};

type KhmerTerm = {
  id: string;
  english: string;
  khmer: string;
};

type Formula = {
  id: string;
  grade: string;
  subject: string;
  lesson: string;
  expression: string;
  description: string;
  status: FormulaStatus;

  variables: FormulaVariable[];
  steps: FormulaStep[];
  khmerTerms: KhmerTerm[];

  prerequisites: string[];
  tags: string[];
};

type CurriculumSubjectOption = {
  name: string;
  lessons: string[];
};

type CurriculumOption = {
  grade: string;
  subjects: CurriculumSubjectOption[];
};

type FormulaDrawerState =
  | {
    mode: "add";
    formula?: undefined;
  }
  | {
    mode: "edit";
    formula: Formula;
  };

type LessonContent = {
  id: string;
  grade: string;
  subject: string;
  lesson: string;
  title: string;
  summary: string;
  body: string;
  status: ContentStatus;
  tags: string[];
};

type ContentDrawerKind =
  | "Concepts"
  | "Examples"
  | "Exercises";

type ContentDrawerState =
  | {
    mode: "add";
    kind: ContentDrawerKind;
    item?: undefined;
  }
  | {
    mode: "edit";
    kind: ContentDrawerKind;
    item: LessonContent;
  };

/* =========================================================
   CONTENT TABS
========================================================= */

const tabs = [
  "Concepts",
  "Formulas",
  "Examples",
  "Exercises",
] as const;

type ContentTab = (typeof tabs)[number];

/* =========================================================
   MAIN PAGE
========================================================= */

export function ContentPage() {
  const router = useRouter();
  const [formulas, setFormulas] =
    useState<Formula[]>([]);

  const [drawerState, setDrawerState] =
    useState<FormulaDrawerState | null>(null);

  const [contentDrawerState, setContentDrawerState] =
    useState<ContentDrawerState | null>(null);

  const [concepts, setConcepts] =
    useState<LessonContent[]>([]);

  const [examples, setExamples] =
    useState<LessonContent[]>([]);

  const [exercises, setExercises] =
    useState<LessonContent[]>([]);

  const [activeTab, setActiveTab] =
    useState<ContentTab>("Formulas");

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedGrade, setSelectedGrade] =
    useState("Grade 12");

  const [selectedSubject, setSelectedSubject] =
    useState("Physics");

  const [selectedLesson, setSelectedLesson] =
    useState("Newton's Second Law");

  const [grades, setGrades] = useState<AdminGradeLevel[]>([]);
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [topics, setTopics] = useState<AdminCurriculumTopic[]>([]);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/auth/Login");
      return;
    }

    let isMounted = true;
    Promise.all([
      loadAdminGrades(),
      loadAdminSubjects(),
      loadAdminTopics(),
      loadAdminCurriculumContent(),
    ])
      .then(([loadedGrades, loadedSubjects, loadedTopics, loadedContent]) => {
        if (!isMounted) return;
        setGrades(loadedGrades);
        setSubjects(loadedSubjects.filter((subject) => subject.status !== "Inactive"));
        setTopics(loadedTopics.filter((topic) => topic.status !== "Inactive"));
        setFormulas(
          loadedContent
            .filter((content) => content.kind === "Formula")
            .map(contentToFormula),
        );
        setConcepts(
          loadedContent
            .filter((content) => content.kind === "Concept")
            .map(contentToLessonContent),
        );
        setExamples(
          loadedContent
            .filter((content) => content.kind === "Example")
            .map(contentToLessonContent),
        );
        setExercises(
          loadedContent
            .filter((content) => content.kind === "Exercise")
            .map(contentToLessonContent),
        );
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

  const curriculumOptions = useMemo(() => {
    if (!grades.length) return [] as CurriculumOption[];

    return grades.map((grade) => {
      const gradeSubjects = subjects
        .filter((subject) => subject.grade_level_id === grade.grade_level_id)
        .sort((left, right) => Number(left.order) - Number(right.order) || left.name.localeCompare(right.name))
        .map((subject) => {
          const subjectTopics = topics
            .filter((topic) => topic.subject_id === subject.subject_id)
            .map((topic) => topic.name);

          return {
            name: subject.name,
            lessons: subjectTopics.length ? subjectTopics : ["No topics yet"],
          };
        });

      return {
        grade: grade.name,
        subjects: gradeSubjects.length
          ? gradeSubjects
          : [{ name: "No subjects yet", lessons: ["No topics yet"] }],
      };
    });
  }, [grades, subjects, topics]);

  const selectedGradeOption =
    curriculumOptions.find(
      (option) =>
        option.grade === selectedGrade,
    ) ?? curriculumOptions[0] ?? {
      grade: "No grades yet",
      subjects: [{ name: "No subjects yet", lessons: ["No topics yet"] }],
    };

  const availableSubjects =
    selectedGradeOption.subjects.map(
      (subject) => subject.name,
    );

  const selectedSubjectOption =
    selectedGradeOption.subjects.find(
      (subject) =>
        subject.name === selectedSubject,
    ) ?? selectedGradeOption.subjects[0];

  const availableLessons =
    selectedSubjectOption.lessons;

  useEffect(() => {
    const firstSubject =
      selectedGradeOption.subjects[0];

    if (
      !selectedGradeOption.subjects.some(
        (subject) =>
          subject.name === selectedSubject,
      )
    ) {
      setSelectedSubject(firstSubject.name);
      setSelectedLesson(firstSubject.lessons[0]);
      return;
    }

    if (
      !selectedSubjectOption.lessons.some(
        (lesson) =>
          lesson === selectedLesson,
      )
    ) {
      setSelectedLesson(
        selectedSubjectOption.lessons[0],
      );
    }
  }, [
    selectedGrade,
    selectedGradeOption,
    selectedLesson,
    selectedSubject,
    selectedSubjectOption,
  ]);

  /* ---------------- SEARCH ---------------- */

  const visibleFormulas = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return formulas.filter((formula) => {
      const matchesContext =
        formula.grade === selectedGrade &&
        formula.subject === selectedSubject &&
        formula.lesson === selectedLesson;

      if (!matchesContext) {
        return false;
      }

      const searchableText = [
        formula.grade,
        formula.subject,
        formula.lesson,
        formula.expression,
        formula.description,
        formula.status,
        ...formula.tags,
        ...formula.prerequisites,
      ]
        .join(" ")
        .toLowerCase();

      return !query || searchableText.includes(query);
    });
  }, [
    formulas,
    searchQuery,
    selectedGrade,
    selectedLesson,
    selectedSubject,
  ]);

  const visibleConcepts = useMemo(
    () =>
      filterLessonContent(
        concepts,
        searchQuery,
        selectedGrade,
        selectedSubject,
        selectedLesson,
      ),
    [
      concepts,
      searchQuery,
      selectedGrade,
      selectedLesson,
      selectedSubject,
    ],
  );

  const visibleExamples = useMemo(
    () =>
      filterLessonContent(
        examples,
        searchQuery,
        selectedGrade,
        selectedSubject,
        selectedLesson,
      ),
    [
      examples,
      searchQuery,
      selectedGrade,
      selectedLesson,
      selectedSubject,
    ],
  );

  const visibleExercises = useMemo(
    () =>
      filterLessonContent(
        exercises,
        searchQuery,
        selectedGrade,
        selectedSubject,
        selectedLesson,
      ),
    [
      exercises,
      searchQuery,
      selectedGrade,
      selectedLesson,
      selectedSubject,
    ],
  );

  /* ---------------- SAVE ---------------- */

  async function saveFormula(nextFormula: Formula) {
    const payload = buildContentPayload("Formula", nextFormula);
    if (!payload) return;
    const savedContent =
      drawerState?.mode === "edit"
        ? await updateAdminCurriculumContent(drawerState.formula.id, payload)
        : await createAdminCurriculumContent(payload);
    const savedFormula = contentToFormula(savedContent);

    setFormulas((currentFormulas) => {
      if (drawerState?.mode === "edit") {
        return currentFormulas.map((formula) =>
          formula.id === drawerState.formula.id
            ? savedFormula
            : formula,
        );
      }

      return [savedFormula, ...currentFormulas];
    });

    setDrawerState(null);
  }

  async function deleteFormula(id: string) {
    await deleteAdminCurriculumContent(id);
    setFormulas((currentFormulas) =>
      currentFormulas.filter(
        (formula) => formula.id !== id,
      ),
    );
  }

  async function saveLessonContent(
    kind: ContentDrawerKind,
    nextItem: LessonContent,
  ) {
    const contentKind = singularContentLabel(kind) as "Concept" | "Example" | "Exercise";
    const payload = buildContentPayload(contentKind, nextItem);
    if (!payload) return;
    const savedContent =
      contentDrawerState?.mode === "edit"
        ? await updateAdminCurriculumContent(contentDrawerState.item.id, payload)
        : await createAdminCurriculumContent(payload);
    const savedItem = contentToLessonContent(savedContent);

    const updateItems = (
      currentItems: LessonContent[],
    ) => {
      if (contentDrawerState?.mode === "edit") {
        return currentItems.map((item) =>
          item.id === contentDrawerState.item.id
            ? savedItem
            : item,
        );
      }

      return [savedItem, ...currentItems];
    };

    if (kind === "Concepts") {
      setConcepts(updateItems);
    }

    if (kind === "Examples") {
      setExamples(updateItems);
    }

    if (kind === "Exercises") {
      setExercises(updateItems);
    }

    setContentDrawerState(null);
  }

  async function deleteLessonContent(
    kind: ContentDrawerKind,
    id: string,
  ) {
    await deleteAdminCurriculumContent(id);
    const removeItem = (
      currentItems: LessonContent[],
    ) =>
      currentItems.filter(
        (item) => item.id !== id,
      );

    if (kind === "Concepts") {
      setConcepts(removeItem);
    }

    if (kind === "Examples") {
      setExamples(removeItem);
    }

    if (kind === "Exercises") {
      setExercises(removeItem);
    }
  }

  function clearContextSearch() {
    setSearchQuery("");
  }

  function buildContentPayload(
    kind: "Formula" | "Concept" | "Example" | "Exercise",
    item: Formula | LessonContent,
  ): AdminCurriculumContentInput | null {
    const selectedGradeData = grades.find((grade) => grade.name === selectedGrade);
    const selectedSubjectData = subjects.find(
      (subject) =>
        subject.grade_level_id === selectedGradeData?.grade_level_id &&
        subject.name === selectedSubject,
    );
    const selectedTopicData = topics.find(
      (topic) =>
        topic.subject_id === selectedSubjectData?.subject_id &&
        topic.name === selectedLesson,
    );

    if (!selectedGradeData || !selectedSubjectData || !selectedTopicData) {
      return null;
    }

    const formulaItem = kind === "Formula" ? (item as Formula) : null;
    const lessonItem = kind === "Formula" ? null : (item as LessonContent);

    return {
      kind,
      grade_level_id: selectedGradeData.grade_level_id,
      subject_id: selectedSubjectData.subject_id,
      topic_id: selectedTopicData.topic_id,
      grade: selectedGrade,
      subject: selectedSubject,
      lesson: selectedLesson,
      title: lessonItem?.title ?? "",
      summary: lessonItem?.summary ?? "",
      body: lessonItem?.body ?? "",
      expression: formulaItem?.expression ?? "",
      description: formulaItem?.description ?? "",
      variables: formulaItem?.variables ?? [],
      steps: formulaItem?.steps ?? [],
      khmerTerms: formulaItem?.khmerTerms ?? [],
      prerequisites: formulaItem?.prerequisites ?? [],
      tags: item.tags,
      status: item.status,
    };
  }

  const actionLabel =
    activeTab === "Formulas"
      ? "Add Formula"
      : `Add ${singularContentLabel(activeTab)}`;

  return (
    <CurriculumShell
      active="Content"
      title={selectedLesson}
      subtitle={`Managing ${selectedSubject} content for ${selectedGrade}.`}
      searchPlaceholder="Search content..."
      actionLabel={actionLabel}
      onAction={() => {
        if (activeTab === "Formulas") {
          setDrawerState({
            mode: "add",
          });
          return;
        }

        setContentDrawerState({
          mode: "add",
          kind: activeTab,
        });
      }}
    >
      {/* ===================================================
          TOP META
      =================================================== */}

      <CurriculumContextPicker
        grade={selectedGrade}
        subject={selectedSubject}
        lesson={selectedLesson}
        gradeOptions={curriculumOptions.map(
          (option) => option.grade,
        )}
        subjectOptions={availableSubjects}
        lessonOptions={availableLessons}
        onGradeChange={(value) => {
          setSelectedGrade(value);
          clearContextSearch();
        }}
        onSubjectChange={(value) => {
          setSelectedSubject(value);
          clearContextSearch();
        }}
        onLessonChange={(value) => {
          setSelectedLesson(value);
          clearContextSearch();
        }}
      />

      {/* ===================================================
          TABS
      =================================================== */}

      <div className="mb-6 border-b border-[#243856]">
        <div className="flex min-w-max gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-3 text-sm font-bold transition ${activeTab === tab
                  ? "text-white"
                  : "text-slate-500 hover:text-slate-300"
                }`}
            >
              {tab}

              {activeTab === tab && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#5368ff]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ===================================================
          FORMULAS
      =================================================== */}

      {activeTab === "Formulas" ? (
        <>
          {/* Search */}

          <div className="relative mb-5 max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              <SearchIcon />
            </span>
            <input
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search formulas..."
              className="h-11 w-full rounded-lg border border-[#35507a] bg-[#101a2b] pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-[#5368ff]"
            />
          </div>

          {/* Formula List */}

          <div className="space-y-3">
            {visibleFormulas.map((formula) => (
              <FormulaCard
                key={formula.id}
                formula={formula}
                onEdit={() =>
                  setDrawerState({
                    mode: "edit",
                    formula,
                  })
                }
                onDelete={() =>
                  deleteFormula(formula.id)
                }
              />
            ))}

            {visibleFormulas.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#35507a] bg-[#0b1324] px-6 py-14 text-center">
                <p className="text-sm font-bold text-slate-400">
                  No formulas found.
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  Try another search or add a new formula.
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <ContentList
          kind={activeTab}
          items={
            activeTab === "Concepts"
              ? visibleConcepts
              : activeTab === "Examples"
                ? visibleExamples
                : visibleExercises
          }
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onEdit={(item) =>
            setContentDrawerState({
              mode: "edit",
              kind: activeTab,
              item,
            })
          }
          onDelete={(id) =>
            deleteLessonContent(activeTab, id)
          }
        />
      )}

      {/* ===================================================
          ADD / EDIT DRAWER
      =================================================== */}

      {drawerState && (
        <FormulaDrawer
          key={
            drawerState.mode === "edit"
              ? drawerState.formula.id
              : "new-formula"
          }
          state={drawerState}
          onClose={() => setDrawerState(null)}
          onSave={saveFormula}
          context={{
            grade: selectedGrade,
            subject: selectedSubject,
            lesson: selectedLesson,
          }}
        />
      )}

      {contentDrawerState && (
        <LessonContentDrawer
          key={
            contentDrawerState.mode === "edit"
              ? contentDrawerState.item.id
              : `new-${contentDrawerState.kind}`
          }
          state={contentDrawerState}
          onClose={() => setContentDrawerState(null)}
          onSave={saveLessonContent}
          context={{
            grade: selectedGrade,
            subject: selectedSubject,
            lesson: selectedLesson,
          }}
        />
      )}
    </CurriculumShell>
  );
}

/* =========================================================
   CURRICULUM CONTEXT PICKER
========================================================= */

function CurriculumContextPicker({
  grade,
  subject,
  lesson,
  gradeOptions,
  subjectOptions,
  lessonOptions,
  onGradeChange,
  onSubjectChange,
  onLessonChange,
}: {
  grade: string;
  subject: string;
  lesson: string;
  gradeOptions: readonly string[];
  subjectOptions: readonly string[];
  lessonOptions: readonly string[];
  onGradeChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onLessonChange: (value: string) => void;
}) {
  return (
    <section className="mb-5 grid gap-3 rounded-xl border border-[#243856] bg-[#0b1324] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.14)] md:grid-cols-[minmax(150px,0.7fr)_minmax(150px,0.7fr)_minmax(220px,1fr)]">
      <PickerSelect
        label="Grade"
        value={grade}
        options={gradeOptions}
        onChange={onGradeChange}
      />

      <PickerSelect
        label="Subject"
        value={subject}
        options={subjectOptions}
        onChange={onSubjectChange}
        tone="cyan"
      />

      <PickerSelect
        label="Lesson"
        value={lesson}
        options={lessonOptions}
        onChange={onLessonChange}
      />
    </section>
  );
}

function PickerSelect({
  label,
  value,
  options,
  onChange,
  tone = "slate",
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  tone?: "cyan" | "slate";
}) {
  const valueClasses =
    tone === "cyan"
      ? "text-cyan-300"
      : "text-white";

  return (
    <label className="relative block">
      <span className="mb-2 block text-[10px] font-extrabold uppercase text-slate-500">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={`h-11 w-full appearance-none rounded-full border border-[#35507a] bg-[#101a2b] px-4 pr-10 text-xs font-extrabold uppercase outline-none transition hover:border-[#5368ff] focus:border-[#5368ff] ${valueClasses}`}
      >
        {options.map((option) => (
          <option key={option}>
            {option}
          </option>
        ))}
      </select>

      <span className="pointer-events-none absolute bottom-3.5 right-4 text-slate-500">
        <ChevronIcon />
      </span>
    </label>
  );
}

/* =========================================================
   FORMULA CARD
========================================================= */

function FormulaCard({
  formula,
  onEdit,
  onDelete,
}: {
  formula: Formula;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="group flex flex-col gap-4 rounded-xl border border-[#243856] bg-[#101a2b] px-5 py-4 shadow-[0_14px_32px_rgba(0,0,0,0.12)] transition hover:border-[#35507a] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        {/* Drag Handle */}

        <div className="mt-1 select-none text-base font-black tracking-[-4px] text-slate-600">
          ⋮⋮
        </div>

        {/* Information */}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-mono text-lg font-bold text-[#1fc7e9]">
              {formula.expression}
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {formula.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-[#263a59] bg-[#142038] px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            {formula.description || "No description"}
          </p>
        </div>
      </div>

      {/* Right side */}

      <div className="flex shrink-0 items-center justify-between gap-5 sm:justify-end">
        <FormulaStatus
          status={formula.status}
        />

        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${formula.expression}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-[#18263d] hover:text-white"
        >
          <EditIcon />
        </button>

        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${formula.expression}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
        >
          <TrashIcon />
        </button>
      </div>
    </article>
  );
}

/* =========================================================
   LESSON CONTENT LIST
========================================================= */

function ContentList({
  kind,
  items,
  searchQuery,
  onSearchChange,
  onEdit,
  onDelete,
}: {
  kind: ContentDrawerKind;
  items: LessonContent[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onEdit: (item: LessonContent) => void;
  onDelete: (id: string) => void;
}) {
  const label = singularContentLabel(kind);

  return (
    <>
      <div className="relative mb-5 max-w-md">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
          <SearchIcon />
        </span>
        <input
          value={searchQuery}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder={`Search ${kind.toLowerCase()}...`}
          className="h-11 w-full rounded-lg border border-[#35507a] bg-[#101a2b] pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-[#5368ff]"
        />
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            label={label}
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item.id)}
          />
        ))}

        {items.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#35507a] bg-[#0b1324] px-6 py-14 text-center">
            <p className="text-sm font-bold text-slate-400">
              No {kind.toLowerCase()} found.
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Add a new {label.toLowerCase()} for this lesson.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function ContentCard({
  item,
  label,
  onEdit,
  onDelete,
}: {
  item: LessonContent;
  label: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="group flex flex-col gap-4 rounded-xl border border-[#243856] bg-[#101a2b] px-5 py-4 shadow-[0_14px_32px_rgba(0,0,0,0.12)] transition hover:border-[#35507a] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#263a59] bg-[#0b1324] text-xs font-black text-[#1fc7e9]">
          {label.slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-extrabold text-white">
              {item.title}
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {item.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-[#263a59] bg-[#142038] px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            {item.summary || "No summary"}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-5 sm:justify-end">
        <FormulaStatus status={item.status} />

        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${item.title}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-[#18263d] hover:text-white"
        >
          <EditIcon />
        </button>

        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${item.title}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
        >
          <TrashIcon />
        </button>
      </div>
    </article>
  );
}

/* =========================================================
   LESSON CONTENT DRAWER
========================================================= */

function LessonContentDrawer({
  state,
  onClose,
  onSave,
  context,
}: {
  state: ContentDrawerState;
  onClose: () => void;
  onSave: (
    kind: ContentDrawerKind,
    item: LessonContent,
  ) => void | Promise<void>;
  context: {
    grade: string;
    subject: string;
    lesson: string;
  };
}) {
  const item = state.item;
  const isEditing = state.mode === "edit";
  const label = singularContentLabel(state.kind);
  const [published, setPublished] =
    useState(
      item
        ? item.status === "Published"
        : false,
    );

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData =
      new FormData(event.currentTarget);

    const title = String(
      formData.get("title") ?? "",
    ).trim();

    if (!title) {
      return;
    }

    const nextItem: LessonContent = {
      id: item?.id ?? createId(),
      grade: item?.grade ?? context.grade,
      subject: item?.subject ?? context.subject,
      lesson: item?.lesson ?? context.lesson,
      title,
      summary: String(
        formData.get("summary") ?? "",
      ).trim(),
      body: String(
        formData.get("body") ?? "",
      ).trim(),
      status: published
        ? "Published"
        : "Draft",
      tags: splitCommaValues(
        String(formData.get("tags") ?? ""),
      ),
    };

    onSave(state.kind, nextItem);
  }

  return (
    <Drawer
      title={
        isEditing
          ? `Edit ${label}`
          : `Add ${label}`
      }
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        <div className="space-y-6 p-6">
          <DrawerSection title={`${label} Title`}>
            <input
              name="title"
              required
              defaultValue={item?.title}
              placeholder={`e.g. ${label} title`}
              className="h-12 w-full rounded-lg border border-[#3b5d8f] bg-[#101a2b] px-4 text-sm font-semibold text-slate-50 outline-none transition placeholder:text-slate-400/70 focus:border-[#6f7cff] focus:ring-2 focus:ring-[#5368ff]/20"
            />
          </DrawerSection>

          <DrawerSection title="Summary">
            <input
              name="summary"
              defaultValue={item?.summary}
              placeholder="Short explanation shown in the content list"
              className="h-12 w-full rounded-lg border border-[#3b5d8f] bg-[#101a2b] px-4 text-sm font-medium text-slate-100 outline-none transition placeholder:text-slate-400/70 focus:border-[#6f7cff] focus:ring-2 focus:ring-[#5368ff]/20"
            />
          </DrawerSection>

          <DrawerSection title="Details">
            <textarea
              name="body"
              defaultValue={item?.body}
              placeholder="Write the full concept, worked example, or exercise instructions..."
              className="min-h-36 w-full resize-none rounded-lg border border-[#3b5d8f] bg-[#101a2b] px-4 py-3 text-sm font-medium leading-6 text-slate-100 outline-none transition placeholder:text-slate-400/70 focus:border-[#6f7cff] focus:ring-2 focus:ring-[#5368ff]/20"
            />
          </DrawerSection>

          <DrawerSection title="Tags">
            <TagInput
              name="tags"
              defaultValue={item?.tags.join(", ")}
              placeholder="Practice, Core Idea"
            />
          </DrawerSection>

          <div className="flex items-center justify-between rounded-lg border border-[#3b5d8f] bg-[#101a2b] p-4">
            <div>
              <p className="text-sm font-semibold text-slate-50">
                Publish {label}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                Published content is visible in the curriculum.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={published}
              onClick={() =>
                setPublished(
                  (current) => !current,
                )
              }
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${published
                  ? "bg-[#5368ff]"
                  : "bg-[#263a59]"
                }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${published
                    ? "left-6"
                    : "left-1"
                  }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3 border-t border-[#243856] bg-[#0b1324] p-6">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-lg border border-[#35507a] bg-[#101a2b] text-sm font-bold text-white transition hover:border-[#5368ff] hover:bg-[#0b1324]"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="h-12 rounded-lg bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:brightness-110"
          >
            {isEditing
              ? "Save Changes"
              : `Save ${label}`}
          </button>
        </div>
      </form>
    </Drawer>
  );
}

/* =========================================================
   FORMULA DRAWER
========================================================= */

function FormulaDrawer({
  state,
  onClose,
  onSave,
  context,
}: {
  state: FormulaDrawerState;
  onClose: () => void;
  onSave: (formula: Formula) => void | Promise<void>;
  context: {
    grade: string;
    subject: string;
    lesson: string;
  };
}) {
  const formula = state.formula;

  const isEditing =
    state.mode === "edit";

  /* =====================================================
     VARIABLES
  ===================================================== */

  const [variables, setVariables] =
    useState<FormulaVariable[]>(
      formula?.variables ?? [
        {
          id: createId(),
          symbol: "",
          meaning: "",
          unit: "",
        },
      ],
    );

  /* =====================================================
     SOLUTION STEPS
  ===================================================== */

  const [steps, setSteps] =
    useState<FormulaStep[]>(
      formula?.steps ?? [
        {
          id: createId(),
          text: "",
        },
      ],
    );

  /* =====================================================
     KHMER TERMS
  ===================================================== */

  const [khmerTerms, setKhmerTerms] =
    useState<KhmerTerm[]>(
      formula?.khmerTerms ?? [
        {
          id: createId(),
          english: "",
          khmer: "",
        },
      ],
    );

  /* =====================================================
     STATUS
  ===================================================== */

  const [published, setPublished] =
    useState(
      formula
        ? formula.status === "Published"
        : false,
    );

  /* =====================================================
     SUBMIT
  ===================================================== */

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData =
      new FormData(event.currentTarget);

    const expression = String(
      formData.get("expression") ?? "",
    ).trim();

    const description = String(
      formData.get("description") ?? "",
    ).trim();

    if (!expression) {
      return;
    }

    const nextFormula: Formula = {
      id:
        formula?.id ??
        createId(),

      grade: formula?.grade ?? context.grade,

      subject: formula?.subject ?? context.subject,

      lesson: formula?.lesson ?? context.lesson,

      expression,

      description,

      status: published
        ? "Published"
        : "Draft",

      variables: variables.filter(
        (variable) =>
          variable.symbol.trim() ||
          variable.meaning.trim() ||
          variable.unit.trim(),
      ),

      steps: steps.filter(
        (step) =>
          step.text.trim(),
      ),

      khmerTerms: khmerTerms.filter(
        (term) =>
          term.english.trim() ||
          term.khmer.trim(),
      ),

      prerequisites:
        splitCommaValues(
          String(
            formData.get(
              "prerequisites",
            ) ?? "",
          ),
        ),

      tags: splitCommaValues(
        String(
          formData.get("tags") ?? "",
        ),
      ),
    };

    onSave(nextFormula);
  }

  /* =====================================================
     VARIABLE FUNCTIONS
  ===================================================== */

  function addVariable() {
    setVariables((current) => [
      ...current,

      {
        id: createId(),
        symbol: "",
        meaning: "",
        unit: "",
      },
    ]);
  }

  function updateVariable(
    id: string,
    field:
      | "symbol"
      | "meaning"
      | "unit",
    value: string,
  ) {
    setVariables((current) =>
      current.map((variable) =>
        variable.id === id
          ? {
            ...variable,
            [field]: value,
          }
          : variable,
      ),
    );
  }

  function removeVariable(
    id: string,
  ) {
    setVariables((current) =>
      current.filter(
        (variable) =>
          variable.id !== id,
      ),
    );
  }

  /* =====================================================
     STEP FUNCTIONS
  ===================================================== */

  function addStep() {
    setSteps((current) => [
      ...current,

      {
        id: createId(),
        text: "",
      },
    ]);
  }

  function updateStep(
    id: string,
    value: string,
  ) {
    setSteps((current) =>
      current.map((step) =>
        step.id === id
          ? {
            ...step,
            text: value,
          }
          : step,
      ),
    );
  }

  function removeStep(
    id: string,
  ) {
    setSteps((current) =>
      current.filter(
        (step) =>
          step.id !== id,
      ),
    );
  }

  /* =====================================================
     KHMER TERM FUNCTIONS
  ===================================================== */

  function addKhmerTerm() {
    setKhmerTerms((current) => [
      ...current,

      {
        id: createId(),
        english: "",
        khmer: "",
      },
    ]);
  }

  function updateKhmerTerm(
    id: string,
    field:
      | "english"
      | "khmer",
    value: string,
  ) {
    setKhmerTerms((current) =>
      current.map((term) =>
        term.id === id
          ? {
            ...term,
            [field]: value,
          }
          : term,
      ),
    );
  }

  function removeKhmerTerm(
    id: string,
  ) {
    setKhmerTerms((current) =>
      current.filter(
        (term) =>
          term.id !== id,
      ),
    );
  }

  /* =====================================================
     DRAWER
  ===================================================== */

  return (
    <Drawer
      title={
        isEditing
          ? "Edit Formula"
          : "Add Formula"
      }
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        <div className="space-y-6 p-6">

          {/* =============================================
              EXPRESSION
          ============================================= */}

          <DrawerSection title="Expression">
            <input
              name="expression"
              required
              defaultValue={
                formula?.expression
              }
              placeholder="e.g. F = ma"
              className="h-12 w-full rounded-lg border border-[#35507a] bg-[#101a2b] px-4 font-mono text-sm font-bold text-[#1fc7e9] outline-none transition placeholder:font-sans placeholder:text-slate-500 focus:border-[#5368ff]"
            />
          </DrawerSection>

          {/* =============================================
              DESCRIPTION
          ============================================= */}

          <DrawerSection title="Description">
            <input
              name="description"
              defaultValue={
                formula?.description
              }
              placeholder="e.g. Fundamental Principle of Dynamics"
              className="h-12 w-full rounded-lg border border-[#35507a] bg-[#101a2b] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-[#5368ff]"
            />
          </DrawerSection>

          {/* =============================================
              VARIABLES
          ============================================= */}

          <DrawerSection
            title="Variables"
            actionLabel="+ Add Variable"
            onAction={addVariable}
          >
            <div className="space-y-2">
              {variables.map(
                (variable) => (
                  <div
                    key={
                      variable.id
                    }
                    className="grid gap-2 rounded-lg border border-[#35507a] bg-[#101a2b] p-2 sm:grid-cols-[28px_76px_1fr_90px_34px]"
                  >
                    {/* Drag */}

                    <div className="flex items-center justify-center select-none font-black tracking-[-4px] text-slate-600">
                      ⋮⋮
                    </div>

                    {/* Symbol */}

                    <input
                      value={
                        variable.symbol
                      }
                      onChange={(
                        event,
                      ) =>
                        updateVariable(
                          variable.id,
                          "symbol",
                          event.target
                            .value,
                        )
                      }
                      placeholder="F"
                      className="h-9 min-w-0 rounded-md border border-[#263a59] bg-[#0b1324] px-2 text-center font-mono text-sm font-bold text-[#1fc7e9] outline-none focus:border-[#5368ff]"
                    />

                    {/* Meaning */}

                    <input
                      value={
                        variable.meaning
                      }
                      onChange={(
                        event,
                      ) =>
                        updateVariable(
                          variable.id,
                          "meaning",
                          event.target
                            .value,
                        )
                      }
                      placeholder="Force"
                      className="h-9 min-w-0 rounded-md border border-[#263a59] bg-[#0b1324] px-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-[#5368ff]"
                    />

                    {/* Unit */}

                    <input
                      value={
                        variable.unit
                      }
                      onChange={(
                        event,
                      ) =>
                        updateVariable(
                          variable.id,
                          "unit",
                          event.target
                            .value,
                        )
                      }
                      placeholder="N"
                      className="h-9 min-w-0 rounded-md border border-[#263a59] bg-[#0b1324] px-2 text-sm font-semibold text-slate-300 outline-none placeholder:text-slate-600 focus:border-[#5368ff]"
                    />

                    {/* Delete */}

                    <RemoveButton
                      label="Remove variable"
                      onClick={() =>
                        removeVariable(
                          variable.id,
                        )
                      }
                    />
                  </div>
                ),
              )}
            </div>

            {variables.length === 0 && (
              <EmptySmallState text="No variables added." />
            )}
          </DrawerSection>

          {/* =============================================
              SOLUTION STEPS
          ============================================= */}

          <DrawerSection
            title="Solution Steps"
            actionLabel="+ Add Step"
            onAction={addStep}
          >
            <div className="space-y-2">
              {steps.map(
                (step, index) => (
                  <div
                    key={step.id}
                    className="grid grid-cols-[34px_1fr_34px] gap-2 rounded-lg border border-[#35507a] bg-[#101a2b] p-2"
                  >
                    {/* Number */}

                    <div className="flex h-9 items-center justify-center text-xs font-extrabold text-slate-500">
                      {index + 1}.
                    </div>

                    {/* Step */}

                    <input
                      value={
                        step.text
                      }
                      onChange={(
                        event,
                      ) =>
                        updateStep(
                          step.id,
                          event.target
                            .value,
                        )
                      }
                      placeholder="Describe this solution step..."
                      className="h-9 min-w-0 rounded-md border border-[#263a59] bg-[#0b1324] px-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-[#5368ff]"
                    />

                    <RemoveButton
                      label="Remove step"
                      onClick={() =>
                        removeStep(
                          step.id,
                        )
                      }
                    />
                  </div>
                ),
              )}
            </div>

            {steps.length === 0 && (
              <EmptySmallState text="No solution steps added." />
            )}
          </DrawerSection>

          {/* =============================================
              KHMER TERMS
          ============================================= */}

          <DrawerSection
            title="Khmer Terms (ពាក្យខ្មែរ)"
            actionLabel="+ Add Term"
            onAction={addKhmerTerm}
          >
            <div className="space-y-2">
              {khmerTerms.map(
                (term) => (
                  <div
                    key={term.id}
                    className="grid gap-2 rounded-lg border border-[#35507a] bg-[#101a2b] p-2 sm:grid-cols-[1fr_28px_1fr_34px]"
                  >
                    {/* English */}

                    <input
                      value={
                        term.english
                      }
                      onChange={(
                        event,
                      ) =>
                        updateKhmerTerm(
                          term.id,
                          "english",
                          event.target
                            .value,
                        )
                      }
                      placeholder="Force"
                      className="h-9 min-w-0 rounded-md border border-[#263a59] bg-[#0b1324] px-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-[#5368ff]"
                    />

                    {/* Arrow */}

                    <div className="flex items-center justify-center text-slate-600">
                      →
                    </div>

                    {/* Khmer */}

                    <input
                      value={
                        term.khmer
                      }
                      onChange={(
                        event,
                      ) =>
                        updateKhmerTerm(
                          term.id,
                          "khmer",
                          event.target
                            .value,
                        )
                      }
                      placeholder="កម្លាំង"
                      className="h-9 min-w-0 rounded-md border border-[#263a59] bg-[#0b1324] px-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-[#5368ff]"
                    />

                    {/* Delete */}

                    <RemoveButton
                      label="Remove Khmer term"
                      onClick={() =>
                        removeKhmerTerm(
                          term.id,
                        )
                      }
                    />
                  </div>
                ),
              )}
            </div>

            {khmerTerms.length ===
              0 && (
                <EmptySmallState text="No Khmer terms added." />
              )}
          </DrawerSection>

          {/* =============================================
              PREREQUISITES + TAGS
          ============================================= */}

          <div className="grid gap-4 sm:grid-cols-2">
            <DrawerSection title="Prerequisites">
              <TagInput
                name="prerequisites"
                defaultValue={
                  formula?.prerequisites.join(
                    ", ",
                  )
                }
                placeholder="Vectors, Motion"
              />
            </DrawerSection>

            <DrawerSection title="Tags">
              <TagInput
                name="tags"
                defaultValue={
                  formula?.tags.join(
                    ", ",
                  )
                }
                placeholder="Dynamics, Force"
              />
            </DrawerSection>
          </div>

          {/* =============================================
              PUBLISH STATUS
          ============================================= */}

          <div className="flex items-center justify-between rounded-lg border border-[#35507a] bg-[#101a2b] p-4">
            <div>
              <p className="text-sm font-bold text-white">
                Publish Formula
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Published formulas are visible in the curriculum.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={
                published
              }
              onClick={() =>
                setPublished(
                  (current) =>
                    !current,
                )
              }
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${published
                  ? "bg-[#5368ff]"
                  : "bg-[#263a59]"
                }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${published
                    ? "left-6"
                    : "left-1"
                  }`}
              />
            </button>
          </div>
        </div>

        {/* =================================================
            BOTTOM ACTIONS
        ================================================= */}

        <div className="mt-auto grid grid-cols-2 gap-3 border-t border-[#243856] bg-[#0b1324] p-6">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-lg border border-[#35507a] bg-[#101a2b] text-sm font-bold text-white transition hover:border-[#5368ff] hover:bg-[#0b1324]"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="h-12 rounded-lg bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:brightness-110"
          >
            {isEditing
              ? "Save Changes"
              : "Save Formula"}
          </button>
        </div>
      </form>
    </Drawer>
  );
}

/* =========================================================
   DRAWER SECTION
========================================================= */

function DrawerSection({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-4">
        <h4 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8da7d8]">
          {title}
        </h4>

        {actionLabel &&
          onAction && (
            <button
              type="button"
              onClick={onAction}
              className="text-xs font-extrabold text-[#5368ff] transition hover:text-[#7a8cff]"
            >
              {actionLabel}
            </button>
          )}
      </div>

      {children}
    </section>
  );
}

/* =========================================================
   TAG INPUT
========================================================= */

function TagInput({
  name,
  defaultValue,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  placeholder: string;
}) {
  return (
    <div>
      <input
        name={name}
        defaultValue={
          defaultValue
        }
        placeholder={
          placeholder
        }
        className="h-12 w-full rounded-lg border border-[#3b5d8f] bg-[#101a2b] px-4 text-sm font-medium text-slate-100 outline-none transition placeholder:text-slate-400/70 focus:border-[#6f7cff] focus:ring-2 focus:ring-[#5368ff]/20"
      />

      <p className="mt-1.5 text-[11px] font-medium text-slate-500">
        Separate multiple values with commas.
      </p>
    </div>
  );
}

/* =========================================================
   REMOVE BUTTON
========================================================= */

function RemoveButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-300"
    >
      <TrashIcon />
    </button>
  );
}

/* =========================================================
   SMALL EMPTY STATE
========================================================= */

function EmptySmallState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-[#35507a] bg-[#101a2b] px-4 py-4 text-center text-xs font-semibold text-slate-600">
      {text}
    </div>
  );
}

/* =========================================================
   FORMULA STATUS
========================================================= */

function FormulaStatus({
  status,
}: {
  status: FormulaStatus;
}) {
  const published =
    status === "Published";

  return (
    <div className="text-right">
      <p className="text-[9px] font-bold text-slate-600">
        Status
      </p>

      <p
        className={`text-[10px] font-extrabold uppercase ${published
            ? "text-emerald-400"
            : "text-amber-400"
          }`}
      >
        {status}
      </p>
    </div>
  );
}

/* =========================================================
   EMPTY TAB
========================================================= */

function EmptyTab({
  tab,
}: {
  tab: ContentTab;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[#35507a] bg-[#0b1324] px-6 py-16 text-center">
      <p className="text-sm font-bold text-slate-400">
        {tab}
      </p>

      <p className="mt-1 text-xs text-slate-600">
        This section is ready for its content editor.
      </p>
    </div>
  );
}

/* =========================================================
   EDIT ICON
========================================================= */

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />

      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

/* =========================================================
   TRASH ICON
========================================================= */

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />

      <path d="M8 6V4h8v2" />

      <path d="M19 6l-1 14H6L5 6" />

      <path d="M10 11v5" />

      <path d="M14 11v5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m21 21-4.3-4.3" />
      <circle cx="11" cy="11" r="7" />
    </svg>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function splitCommaValues(
  value: string,
) {
  return value
    .split(",")
    .map((item) =>
      item.trim(),
    )
    .filter(Boolean);
}

function contentToFormula(content: AdminCurriculumContent): Formula {
  return {
    id: content.content_id,
    grade: content.grade,
    subject: content.subject,
    lesson: content.lesson,
    expression: content.expression,
    description: content.description,
    status: content.status,
    variables: content.variables as FormulaVariable[],
    steps: content.steps as FormulaStep[],
    khmerTerms: content.khmerTerms as KhmerTerm[],
    prerequisites: content.prerequisites,
    tags: content.tags,
  };
}

function contentToLessonContent(content: AdminCurriculumContent): LessonContent {
  return {
    id: content.content_id,
    grade: content.grade,
    subject: content.subject,
    lesson: content.lesson,
    title: content.title,
    summary: content.summary,
    body: content.body,
    status: content.status,
    tags: content.tags,
  };
}

function filterLessonContent(
  items: LessonContent[],
  searchQuery: string,
  grade: string,
  subject: string,
  lesson: string,
) {
  const query =
    searchQuery.trim().toLowerCase();

  return items.filter((item) => {
    if (
      item.grade !== grade ||
      item.subject !== subject ||
      item.lesson !== lesson
    ) {
      return false;
    }

    const searchableText = [
      item.title,
      item.summary,
      item.body,
      item.status,
      ...item.tags,
    ]
      .join(" ")
      .toLowerCase();

    return !query || searchableText.includes(query);
  });
}

function singularContentLabel(
  kind: ContentDrawerKind,
) {
  if (kind === "Concepts") {
    return "Concept";
  }

  if (kind === "Examples") {
    return "Example";
  }

  return "Exercise";
}

function createId() {
  if (
    typeof globalThis !==
    "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto
      .randomUUID ===
    "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

export default ContentPage;
