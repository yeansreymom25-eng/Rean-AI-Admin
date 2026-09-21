import { describe, expect, it } from "vitest";
import katex from "katex";

describe("Curriculum Content LaTeX Rendering & Validation Suite", () => {
  describe("KaTeX Rendering", () => {
    it("renders valid STEM LaTeX formulas without error", () => {
      const formulas = [
        "n_1 \\sin(\\theta_1) = n_2 \\sin(\\theta_2)", // Optics: Snell's Law
        "PV = nRT", // Thermodynamics: Ideal Gas
        "v = v_0 + at", // Kinematics: Acceleration
        "\\lim_{x \\to 3} \\frac{x^2 - 9}{x - 3} = 6", // Limits
        "\\Delta H = \\sum H_{products} - \\sum H_{reactants}", // Chemistry Thermochemistry
      ];

      for (const formula of formulas) {
        const html = katex.renderToString(formula, { throwOnError: true });
        expect(html).toContain("katex");
      }
    });

    it("throws error for malformed LaTeX to protect student visual tutor", () => {
      const brokenLatex = "\\frac{unclosed";
      expect(() => {
        katex.renderToString(brokenLatex, { throwOnError: true });
      }).toThrow();
    });
  });

  describe("Curriculum Quality Gate Validation", () => {
    function validateCurriculumItem(input: {
      expression: string;
      steps: Array<{ heading: string; explanation: string; latex?: string }>;
      khmerTerms: Array<{ english: string; khmer: string }>;
      published: boolean;
    }): string[] {
      const errs: string[] = [];
      const trimmedExpr = input.expression.trim();

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

      input.steps.forEach((st, idx) => {
        if (st.latex && st.latex.trim()) {
          try {
            katex.renderToString(st.latex.trim(), { throwOnError: true });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            errs.push(`LaTeX syntax error in Step ${idx + 1}: ${msg}`);
          }
        }
      });

      if (input.published) {
        const hasContent =
          trimmedExpr.length > 0 ||
          input.steps.some((s) => s.heading.trim() || s.explanation.trim() || (s.latex && s.latex.trim()));
        if (!hasContent) {
          errs.push("Published content must include at least one formula expression or worked step.");
        }

        const hasKhmer = input.khmerTerms.some((t) => t.english.trim() && t.khmer.trim());
        if (!hasKhmer) {
          errs.push("Published content must include at least one English-to-Khmer vocabulary term.");
        }
      }

      return errs;
    }

    it("blocks publishing when Khmer terms are missing", () => {
      const errors = validateCurriculumItem({
        expression: "n_1 \\sin(\\theta_1) = n_2 \\sin(\\theta_2)",
        steps: [
          {
            heading: "Step 1: Identify indices",
            explanation: "Identify medium 1 and 2 refractive indices",
            latex: "n_1 = 1.0, n_2 = 1.33",
          },
        ],
        khmerTerms: [],
        published: true,
      });

      expect(errors).toContain("Published content must include at least one English-to-Khmer vocabulary term.");
    });

    it("detects malformed LaTeX in step equations", () => {
      const errors = validateCurriculumItem({
        expression: "F = ma",
        steps: [
          {
            heading: "Step 1: Calculate force",
            explanation: "Substitute values",
            latex: "\\sqrt{broken",
          },
        ],
        khmerTerms: [{ english: "force", khmer: "កម្លាំង" }],
        published: true,
      });

      expect(errors.some((e) => e.includes("LaTeX syntax error in Step 1"))).toBe(true);
    });

    it("allows draft mode without blocking on publish constraints", () => {
      const errors = validateCurriculumItem({
        expression: "E = mc^2",
        steps: [],
        khmerTerms: [],
        published: false,
      });

      expect(errors).toHaveLength(0);
    });

    it("accepts fully formed curriculum content with LaTeX, steps, and Khmer vocabulary", () => {
      const errors = validateCurriculumItem({
        expression: "n_1 \\sin(\\theta_1) = n_2 \\sin(\\theta_2)",
        steps: [
          {
            heading: "Step 1: State Snell's Law",
            explanation: "Relate the incident angle to the refracted angle.",
            latex: "n_1 \\sin(\\theta_1) = n_2 \\sin(\\theta_2)",
          },
          {
            heading: "Step 2: Solve for refraction angle",
            explanation: "Rearrange to isolate sin(theta_2)",
            latex: "\\sin(\\theta_2) = \\frac{n_1 \\sin(\\theta_1)}{n_2}",
          },
        ],
        khmerTerms: [
          { english: "refraction", khmer: "ចំណាំងបង្វែរ" },
          { english: "refractive index", khmer: "សន្ទស្សន៍ចំណាំងបង្វែរ" },
        ],
        published: true,
      });

      expect(errors).toHaveLength(0);
    });
  });
});
