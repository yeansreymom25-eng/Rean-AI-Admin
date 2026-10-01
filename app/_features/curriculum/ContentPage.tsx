"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  loadAdminCurriculumVersions,
  loadAdminGrades,
  loadAdminSubjects,
  loadAdminTopics,
  updateAdminCurriculumContent,
  type AdminCurriculumContent,
  type AdminCurriculumContentInput,
  type AdminCurriculumTopic,
  type AdminCurriculumVersion,
  type AdminGradeLevel,
  type AdminSubject,
} from "../auth/adminAuth";
import katex from "katex";
import { CurriculumShell } from "./CurriculumShell";
import { Drawer } from "./Shared";
import { FormulaEditor, type FormulaVariable } from "./components/FormulaEditor";
import { WorkedStepsEditor, type WorkedStep } from "./components/WorkedStepsEditor";
import { MisconceptionsEditor, type MisconceptionItem } from "./components/MisconceptionsEditor";
import { KhmerTermsEditor, type KhmerTermItem } from "./components/KhmerTermsEditor";
import { KatexPreview } from "./components/KatexPreview";
import { BulkImportModal } from "./components/BulkImportModal";

/* =========================================================
   TYPES
========================================================= */

type FormulaStatus = "Published" | "Draft";
type ContentStatus = "Published" | "Draft";

type FormulaStep = WorkedStep;
type KhmerTerm = KhmerTermItem;

type Formula = {
  id: string;
  grade: string;
  subject: string;
  lesson: string;
  subtopic?: string;
  expression: string;
  description: string;
  status: FormulaStatus;

  variables: FormulaVariable[];
  steps: FormulaStep[];
  khmerTerms: KhmerTerm[];
  misconceptions?: MisconceptionItem[];

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
  const [versions, setVersions] = useState<AdminCurriculumVersion[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const refreshCurriculum = useCallback(() => {
    return Promise.all([
      loadAdminGrades(),
      loadAdminSubjects(),
      loadAdminTopics(),
      loadAdminCurriculumContent(),
      loadAdminCurriculumVersions(),
    ])
      .then(([loadedGrades, loadedSubjects, loadedTopics, loadedContent, loadedVersions]) => {
        setGrades(loadedGrades);
        setSubjects(loadedSubjects.filter((subject) => subject.status !== "Inactive"));
        setTopics(loadedTopics.filter((topic) => topic.status !== "Inactive"));
        setVersions(loadedVersions);
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
  }, [router]);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/auth/Login");
      return;
    }

    void refreshCurriculum();
  }, [refreshCurriculum, router]);

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

  const selectedGradeOption = useMemo(() =>
    curriculumOptions.find(
      (option) =>
        option.grade === selectedGrade,
    ) ?? curriculumOptions[0] ?? {
      grade: "No grades yet",
      subjects: [{ name: "No subjects yet", lessons: ["No topics yet"] }],
    }, [curriculumOptions, selectedGrade]);

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
      queueMicrotask(() => {
        setSelectedSubject(firstSubject.name);
        setSelectedLesson(firstSubject.lessons[0]);
      });
      return;
    }

    if (
      !selectedSubjectOption.lessons.some(
        (lesson) =>
          lesson === selectedLesson,
      )
    ) {
      queueMicrotask(() => setSelectedLesson(selectedSubjectOption.lessons[0]));
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
  ): AdminCurriculumContentInput {
    const selectedGradeData = grades.find((grade) => grade.name === selectedGrade);
    if (!selectedGradeData) {
      throw new Error(`Grade '${selectedGrade}' not found in curriculum data.`);
    }

    const selectedSubjectData = subjects.find(
      (subject) =>
        subject.grade_level_id === selectedGradeData.grade_level_id &&
        subject.name === selectedSubject,
    );
    if (!selectedSubjectData) {
      throw new Error(`Subject '${selectedSubject}' not found for ${selectedGrade}.`);
    }

    const selectedTopicData = topics.find(
      (topic) =>
        topic.subject_id === selectedSubjectData.subject_id &&
        topic.name === selectedLesson,
    );
    if (!selectedTopicData) {
      throw new Error(`Lesson '${selectedLesson}' not found for ${selectedSubject}.`);
    }

    const selectedVersion =
      versions.find((version) =>
        version.grade_level_id === selectedGradeData.grade_level_id &&
        version.subject_id === selectedSubjectData.subject_id &&
        version.status === "draft",
      ) ||
      versions.find((version) =>
        version.grade_level_id === selectedGradeData.grade_level_id &&
        version.subject_id === selectedSubjectData.subject_id &&
        version.status !== "archived",
      ) ||
      versions.find((version) =>
        version.grade_level_id === selectedGradeData.grade_level_id &&
        version.subject_id === selectedSubjectData.subject_id,
      );

    if (!selectedVersion) {
      throw new Error(
        `No curriculum version found for ${selectedSubject} (${selectedGrade}). Please create a draft version in the Curriculum Versions tab before adding content.`
      );
    }

    const formulaItem = kind === "Formula" ? (item as Formula) : null;
    const lessonItem = kind === "Formula" ? null : (item as LessonContent);

    return {
      kind,
      curriculum_version_id: selectedVersion.curriculum_version_id,
      grade_level_id: selectedGradeData.grade_level_id,
      subject_id: selectedSubjectData.subject_id,
      topic_id: selectedTopicData.topic_id,
      grade: selectedGrade,
      subject: selectedSubject,
      lesson: selectedLesson,
      subtopic: formulaItem?.subtopic || selectedLesson,
      title: lessonItem?.title ?? "",
      summary: lessonItem?.summary ?? "",
      body: lessonItem?.body ?? "",
      expression: formulaItem?.expression ?? "",
      description: formulaItem?.description ?? "",
      variables: formulaItem?.variables ?? [],
      steps: formulaItem?.steps ?? [],
      khmerTerms: formulaItem?.khmerTerms ?? [],
      common_misconceptions: formulaItem?.misconceptions ?? [],
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
      secondaryActionLabel="Bulk Import"
      onSecondaryAction={() => setIsImportModalOpen(true)}
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

      <div className="mb-6 border-b border-line">
        <div className="flex min-w-max gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-3 text-sm font-bold transition ${activeTab === tab
                  ? "text-fg"
                  : "text-slate-500 hover:text-slate-300"
                }`}
            >
              {tab}

              {activeTab === tab && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" />
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
              className="h-11 w-full rounded-lg border border-line-strong bg-surface-2 pl-11 pr-4 text-sm font-semibold text-fg outline-none transition placeholder:text-slate-500 focus:border-brand"
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
              <div className="rounded-xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
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
            availableLessons,
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

      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => {
          refreshCurriculum();
        }}
      />
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
    <section className="mb-5 grid gap-3 rounded-xl border border-line bg-surface p-4 shadow-card md:grid-cols-[minmax(150px,0.7fr)_minmax(150px,0.7fr)_minmax(220px,1fr)]">
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
      : "text-fg";

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
        className={`h-11 w-full appearance-none rounded-full border border-line-strong bg-surface-2 px-4 pr-10 text-xs font-extrabold uppercase outline-none transition hover:border-brand focus:border-brand ${valueClasses}`}
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
    <article className="group flex flex-col gap-4 rounded-xl border border-line bg-surface-2 px-5 py-4 shadow-card transition hover:border-line-strong sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        {/* Drag Handle */}

        <div className="mt-1 select-none text-base font-black tracking-[-4px] text-slate-600">
          ⋮⋮
        </div>

        {/* Information */}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-lg font-bold text-info">
              <KatexPreview latex={formula.expression} displayMode={false} />
            </div>

            {formula.subtopic && (
              <span className="rounded border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-bold text-indigo-300">
                {formula.subtopic}
              </span>
            )}

            <div className="flex flex-wrap gap-1.5">
              {formula.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-line bg-surface-3 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-1 text-xs font-semibold text-slate-400">
            {formula.description || "No description"}
          </p>

          {((formula.steps && formula.steps.length > 0) || (formula.khmerTerms && formula.khmerTerms.length > 0)) && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-400">
              {formula.steps && formula.steps.length > 0 && (
                <span className="rounded bg-surface-3 px-2 py-0.5 text-slate-400">
                  {formula.steps.length} worked step{formula.steps.length > 1 ? "s" : ""}
                </span>
              )}
              {formula.variables && formula.variables.length > 0 && (
                <span className="rounded bg-surface-3 px-2 py-0.5 text-slate-400">
                  {formula.variables.length} variable{formula.variables.length > 1 ? "s" : ""}
                </span>
              )}
              {formula.khmerTerms && formula.khmerTerms.length > 0 && (
                <span className="rounded bg-surface-3 px-2 py-0.5 text-slate-400">
                  {formula.khmerTerms.length} Khmer term{formula.khmerTerms.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
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
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-surface-3 hover:text-fg"
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
          className="h-11 w-full rounded-lg border border-line-strong bg-surface-2 pl-11 pr-4 text-sm font-semibold text-fg outline-none transition placeholder:text-slate-500 focus:border-brand"
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
          <div className="rounded-xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
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
    <article className="group flex flex-col gap-4 rounded-xl border border-line bg-surface-2 px-5 py-4 shadow-card transition hover:border-line-strong sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-xs font-black text-info">
          {label.slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-extrabold text-fg">
              {item.title}
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {item.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-line bg-surface-3 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500"
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
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-surface-3 hover:text-fg"
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData =
      new FormData(event.currentTarget);

    const title = String(
      formData.get("title") ?? "",
    ).trim();

    if (!title) {
      setSubmitError("Title is required.");
      formRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

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

    try {
      await onSave(state.kind, nextItem);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
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
        ref={formRef}
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
              className="h-12 w-full rounded-lg border border-line-strong bg-surface-2 px-4 text-sm font-semibold text-slate-50 outline-none transition placeholder:text-slate-400/70 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </DrawerSection>

          <DrawerSection title="Summary">
            <input
              name="summary"
              defaultValue={item?.summary}
              placeholder="Short explanation shown in the content list"
              className="h-12 w-full rounded-lg border border-line-strong bg-surface-2 px-4 text-sm font-medium text-slate-100 outline-none transition placeholder:text-slate-400/70 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </DrawerSection>

          <DrawerSection title="Details">
            <textarea
              name="body"
              defaultValue={item?.body}
              placeholder="Write the full concept, worked example, or exercise instructions..."
              className="min-h-36 w-full resize-none rounded-lg border border-line-strong bg-surface-2 px-4 py-3 text-sm font-medium leading-6 text-slate-100 outline-none transition placeholder:text-slate-400/70 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </DrawerSection>

          <DrawerSection title="Tags">
            <TagInput
              name="tags"
              defaultValue={item?.tags.join(", ")}
              placeholder="Practice, Core Idea"
            />
          </DrawerSection>

          <div className="flex items-center justify-between rounded-lg border border-line-strong bg-surface-2 p-4">
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
                  ? "bg-brand"
                  : "bg-surface-3"
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

        {submitError && (
          <div className="border-t border-rose-500/40 bg-rose-500/15 px-6 py-3">
            <p className="text-xs font-bold text-rose-300">⚠️ Failed to save:</p>
            <p className="mt-0.5 text-xs text-rose-200">{submitError}</p>
          </div>
        )}

        <div className="mt-auto grid grid-cols-2 gap-3 border-t border-line bg-surface p-6">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-lg border border-line-strong bg-surface-2 text-sm font-bold text-fg transition hover:border-brand hover:bg-surface"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 rounded-lg bg-gradient-to-r from-brand to-brand-2 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving...
              </span>
            ) : (
              isEditing ? "Save Changes" : `Save ${label}`
            )}
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
    availableLessons?: string[];
  };
}) {
  const formula = state.formula;
  const isEditing = state.mode === "edit";

  const [topic, setTopic] = useState(formula?.lesson ?? context.lesson);
  const [subtopic, setSubtopic] = useState(formula?.subtopic ?? "");
  const [expression, setExpression] = useState(formula?.expression ?? "");
  const [description, setDescription] = useState(formula?.description ?? "");

  const [variables, setVariables] = useState<FormulaVariable[]>(
    formula?.variables ?? [
      {
        id: createId(),
        symbol: "",
        meaning: "",
        unit: "",
      },
    ],
  );

  const [steps, setSteps] = useState<FormulaStep[]>(
    formula?.steps ?? [
      {
        id: createId(),
        heading: "Step 1 · Identify Given Variables & Formula",
        explanation: "",
        latex: "",
      },
    ],
  );

  const [misconceptions, setMisconceptions] = useState<MisconceptionItem[]>(
    formula?.misconceptions ?? [],
  );

  const [khmerTerms, setKhmerTerms] = useState<KhmerTerm[]>(
    formula?.khmerTerms ?? [
      {
        id: createId(),
        english: "",
        khmer: "",
      },
    ],
  );

  const [prerequisites, setPrerequisites] = useState(
    formula?.prerequisites?.join(", ") ?? "",
  );
  const [tags, setTags] = useState(
    formula?.tags?.join(", ") ?? "",
  );

  const [published, setPublished] = useState(
    formula ? formula.status === "Published" : false,
  );

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function validate(
    expr: string,
    stps: FormulaStep[],
    terms: KhmerTerm[],
    isPub: boolean,
  ): string[] {
    const errs: string[] = [];
    const trimmedExpr = expr.trim();

    if (!trimmedExpr) {
      errs.push("Formula expression cannot be empty.");
    } else {
      try {
        katex.renderToString(trimmedExpr, { throwOnError: true });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errs.push(`LaTeX syntax error in formula: ${msg}`);
      }
    }

    stps.forEach((st, idx) => {
      if (st.latex && st.latex.trim()) {
        try {
          katex.renderToString(st.latex.trim(), { throwOnError: true });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          errs.push(`LaTeX syntax error in Step ${idx + 1}: ${msg}`);
        }
      }
    });

    if (isPub) {
      const hasContent =
        trimmedExpr.length > 0 ||
        stps.some((s) => s.heading.trim() || s.explanation.trim() || (s.latex && s.latex.trim()));
      if (!hasContent) {
        errs.push("Published content must include at least one formula expression or worked step.");
      }

      const hasKhmer = terms.some((t) => t.english.trim() && t.khmer.trim());
      if (!hasKhmer) {
        errs.push("Publishing requires at least one English-to-Khmer vocabulary term (please add one in the Khmer Terms section).");
      }
    }

    return errs;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errs = validate(expression, steps, khmerTerms, published);
    if (errs.length > 0) {
      setValidationErrors(errs);
      formRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setValidationErrors([]);
    setSubmitError(null);
    setIsSubmitting(true);

    const nextFormula: Formula = {
      id: formula?.id ?? createId(),
      grade: formula?.grade ?? context.grade,
      subject: formula?.subject ?? context.subject,
      lesson: topic.trim() || context.lesson,
      subtopic: subtopic.trim() || undefined,
      expression: expression.trim(),
      description: description.trim(),
      status: published ? "Published" : "Draft",
      variables: variables.filter(
        (v) => v.symbol.trim() || v.meaning.trim() || v.unit.trim(),
      ),
      steps: steps.filter(
        (s) => s.heading.trim() || s.explanation.trim() || (s.latex && s.latex.trim()),
      ),
      khmerTerms: khmerTerms.filter(
        (t) => t.english.trim() || t.khmer.trim(),
      ),
      misconceptions: misconceptions.filter(
        (m) => m.misconception.trim() || m.correction.trim(),
      ),
      prerequisites: splitCommaValues(prerequisites),
      tags: splitCommaValues(tags),
    };

    try {
      await onSave(nextFormula);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Drawer
      title={isEditing ? "Edit Formula & Curriculum Content" : "Author STEM Curriculum Content"}
      onClose={onClose}
    >
      <form ref={formRef} onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="space-y-6 p-6">
          {/* Validation Errors Alert */}
          {validationErrors.length > 0 && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4">
              <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
                <span>⚠️ Quality Gate & Validation Issues</span>
              </div>
              <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-rose-200">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Topic & Subtopic */}
          <div className="rounded-xl border border-line bg-surface p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-surface-3 px-2 py-0.5 text-xs font-bold text-slate-400">
                  {context.grade}
                </span>
                <span className="rounded bg-surface-3 px-2 py-0.5 text-xs font-bold text-indigo-400">
                  {context.subject}
                </span>
              </div>
              <span className="text-xs text-slate-500">STEM Curriculum Node</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Topic (Lesson)
                </label>
                {context.availableLessons && context.availableLessons.length > 0 ? (
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="h-11 w-full rounded-lg border border-line-strong bg-surface-2 px-3 text-sm font-semibold text-fg outline-none focus:border-brand"
                  >
                    {context.availableLessons.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="h-11 w-full rounded-lg border border-line-strong bg-surface-2 px-3 text-sm font-semibold text-fg outline-none focus:border-brand"
                    placeholder="e.g. Limits of Functions"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Subtopic / Section Name
                </label>
                <input
                  value={subtopic}
                  onChange={(e) => setSubtopic(e.target.value)}
                  placeholder="e.g. Indeterminate Form 0/0, Snell's Law"
                  className="h-11 w-full rounded-lg border border-line-strong bg-surface-2 px-3 text-sm font-semibold text-fg outline-none placeholder:text-slate-600 focus:border-brand"
                />
              </div>
            </div>
          </div>

          {/* Formula & Variables Editor */}
          <FormulaEditor
            expression={expression}
            onExpressionChange={(val) => {
              setExpression(val);
              if (validationErrors.length > 0) setValidationErrors([]);
            }}
            description={description}
            onDescriptionChange={setDescription}
            variables={variables}
            onVariablesChange={setVariables}
          />

          {/* Worked Solution Steps Blueprint */}
          <WorkedStepsEditor
            steps={steps}
            onStepsChange={setSteps}
          />

          {/* Common Misconceptions */}
          <MisconceptionsEditor
            misconceptions={misconceptions}
            onMisconceptionsChange={setMisconceptions}
          />

          {/* Khmer Vocabulary Terms */}
          <KhmerTermsEditor
            terms={khmerTerms}
            onTermsChange={setKhmerTerms}
          />

          {/* Prerequisites + Tags */}
          <div className="grid gap-4 sm:grid-cols-2">
            <DrawerSection title="Prerequisites">
              <input
                value={prerequisites}
                onChange={(e) => setPrerequisites(e.target.value)}
                placeholder="e.g. Vectors, Factoring, Trig identities"
                className="h-11 w-full rounded-lg border border-line-strong bg-surface-2 px-3 text-sm font-semibold text-fg outline-none placeholder:text-slate-600 focus:border-brand"
              />
            </DrawerSection>

            <DrawerSection title="Search Tags">
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. Optics, Refraction, Physics"
                className="h-11 w-full rounded-lg border border-line-strong bg-surface-2 px-3 text-sm font-semibold text-fg outline-none placeholder:text-slate-600 focus:border-brand"
              />
            </DrawerSection>
          </div>

          {/* Publish Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-line-strong bg-surface-2 p-4">
            <div>
              <p className="text-sm font-bold text-fg">Publish to Student Visual Tutor</p>
              <p className="mt-1 text-xs text-slate-400">
                Published content is indexed for RAG retrieval and immediate whiteboard generation.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={published}
              onClick={() => {
                const nextPub = !published;
                setPublished(nextPub);
                if (nextPub) {
                  const check = validate(expression, steps, khmerTerms, true);
                  setValidationErrors(check);
                } else {
                  setValidationErrors((prev) =>
                    prev.filter((e) => !e.includes("Published content") && !e.includes("Publishing requires"))
                  );
                }
              }}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                published ? "bg-brand" : "bg-surface-3"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${
                  published ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Inline Bottom Validation Errors Alert */}
        {validationErrors.length > 0 && (
          <div className="border-t border-rose-500/30 bg-rose-500/10 px-6 py-3">
            <p className="text-xs font-bold text-rose-300">
              ⚠️ Please resolve {validationErrors.length} issue{validationErrors.length > 1 ? "s" : ""} before saving:
            </p>
            <ul className="mt-1 list-disc list-inside space-y-0.5 text-xs text-rose-200">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit Network / Server Error */}
        {submitError && (
          <div className="border-t border-rose-500/40 bg-rose-500/15 px-6 py-3">
            <p className="text-xs font-bold text-rose-300">⚠️ Failed to save:</p>
            <p className="mt-0.5 text-xs text-rose-200">{submitError}</p>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-auto grid grid-cols-2 gap-3 border-t border-line bg-surface p-6">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-lg border border-line-strong bg-surface-2 text-sm font-bold text-fg transition hover:border-brand hover:bg-surface"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 rounded-lg bg-gradient-to-r from-brand to-brand-2 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving...
              </span>
            ) : (
              isEditing ? "Save Changes" : "Save Formula & Steps"
            )}
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
        <h4 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-accent-fg">
          {title}
        </h4>

        {actionLabel &&
          onAction && (
            <button
              type="button"
              onClick={onAction}
              className="text-xs font-extrabold text-brand transition hover:text-brand"
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
        className="h-12 w-full rounded-lg border border-line-strong bg-surface-2 px-4 text-sm font-medium text-slate-100 outline-none transition placeholder:text-slate-400/70 focus:border-brand focus:ring-2 focus:ring-brand/20"
      />

      <p className="mt-1.5 text-[11px] font-medium text-slate-500">
        Separate multiple values with commas.
      </p>
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
    subtopic: content.subtopic ?? "",
    expression: content.expression,
    description: content.description,
    status: content.status,
    variables: (content.variables || []) as FormulaVariable[],
    steps: ((content.steps || []) as Array<Record<string, unknown>>).map((s, idx) => ({
      id: String(s.id ?? `step-${idx}`),
      heading: String(s.heading ?? `Step ${idx + 1}`),
      explanation: String(s.explanation ?? s.text ?? ""),
      latex: typeof s.latex === "string" ? s.latex : undefined,
    })),
    khmerTerms: (content.khmerTerms || []) as KhmerTerm[],
    misconceptions: ((content.common_misconceptions || []) as Array<Record<string, unknown>>).map((m, idx) => ({
      id: String(m.id ?? `mis-${idx}`),
      misconception: String(m.misconception ?? m.text ?? ""),
      correction: String(m.correction ?? ""),
    })),
    prerequisites: content.prerequisites || [],
    tags: content.tags || [],
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
