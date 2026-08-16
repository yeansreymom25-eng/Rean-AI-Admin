export const grades = [
  {
    name: "Grade 12",
    khmer: "Cambodian Grade 12",
    number: "12",
    description:
      "High school graduation year with national exam preparation including Physics and advanced Math.",
  },
  {
    name: "Grade 11",
    khmer: "Cambodian Grade 11",
    number: "11",
    description:
      "Upper secondary curriculum covering Chemistry, advanced equations, and deeper reasoning skills.",
  },
  {
    name: "Grade 10",
    khmer: "Cambodian Grade 10",
    number: "10",
    description:
      "Foundation for upper secondary study with core science and social science tracks.",
  },
];

export const subjects = [
  {
    name: "Math",
    khmer: "Mathematics",
    code: "MATH",
    icon: "fx",
    description: "Advanced mathematics including Calculus and Algebra.",
    order: "1",
    status: "Active",
  },
  {
    name: "Physics",
    khmer: "Physics",
    code: "PHYS",
    icon: "at",
    description:
      "Fundamental principles of matter and energy, including Newton's Second Law.",
    order: "2",
    status: "Draft",
  },
  {
    name: "Chemistry",
    khmer: "Chemistry",
    code: "CHEM",
    icon: "o2",
    description: "Study of substances, reactions, and balancing chemical equations.",
    order: "3",
    status: "Inactive",
  },
];

export const curriculumLinks = [
  { label: "Grades", href: "/grade_levels" },
  { label: "Subjects", href: "/subjects" },
  { label: "Topics", href: "/topics" },
  { label: "Content", href: "/content" },
];
