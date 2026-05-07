import { describe, expect, it } from "vitest";
import { scoreResume } from "../src/lib/ats/scorer";
import { emptyResume } from "../src/lib/resume/types";

describe("scoreResume", () => {
  it("penalizes a totally empty resume on formatting", () => {
    const r = emptyResume("");
    const s = scoreResume({ resume: r });
    expect(s.formatting).toBeLessThan(80);
    expect(s.overall).toBeLessThan(70);
  });

  it("rewards quantified bullets and matched keywords", () => {
    const r = emptyResume("Jane Doe");
    r.headline = "VP Operations";
    r.contact = { email: "jane@example.com", phone: "+1 555 0100" };
    r.summary =
      "Operational executive with 15+ years driving digital transformation across enterprise.";
    r.experience = [
      {
        id: "1",
        company: "Acme Corp",
        role: "VP Operations",
        startDate: "2018",
        endDate: "Present",
        bullets: [
          "Reduced operational expenditure by $45M annually across 5 regional hubs.",
          "Improved delivery fulfillment by 22% via predictive analytics deployment.",
          "Led cross-functional teams of 400+ across EMEA and APAC.",
        ],
      },
    ];
    r.education = [
      { id: "1", school: "Harvard Business School", degree: "MBA", startDate: "2010", endDate: "2012" },
    ];
    r.skills = [{ id: "1", label: "Core", items: ["Operations", "Digital Transformation", "P&L"] }];

    const s = scoreResume({
      resume: r,
      keywords: ["operational excellence", "digital transformation", "p&l", "leadership"],
    });
    expect(s.quantification).toBeGreaterThanOrEqual(60);
    expect(s.formatting).toBeGreaterThanOrEqual(80);
    expect(s.overall).toBeGreaterThan(50);
  });

  it("flags weak verbs in readability", () => {
    const r = emptyResume("X");
    r.experience = [
      {
        id: "1",
        company: "Y",
        role: "Z",
        bullets: ["Responsible for daily operations.", "Helped the team meet goals."],
      },
    ];
    const s = scoreResume({ resume: r });
    expect(s.readability).toBeLessThan(80);
  });
});
