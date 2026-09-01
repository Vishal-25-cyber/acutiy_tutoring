/**
 * Acuity Tutoring — Curriculum & Syllabus Architecture
 * Strict syllabus alignment for CBSE (NCERT) and State Board (Samacheer Kalvi / Standard State Board)
 * Covering Class 6 to Class 10
 */

export type SupportedBoard = "CBSE" | "State Board";

export type SupportedClass =
  | "Class 6"
  | "Class 7"
  | "Class 8"
  | "Class 9"
  | "Class 10";

export interface ClassCurriculum {
  classLevel: SupportedClass;
  board: SupportedBoard;
  description: string;
  subjects: {
    name: string;
    code?: string;
    isCore: boolean;
    description: string;
  }[];
}

export const BOARD_LIST: SupportedBoard[] = ["CBSE", "State Board"];

export const CLASS_LIST: SupportedClass[] = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
];

export const CURRICULUM_DATA: Record<SupportedBoard, Record<SupportedClass, string[]>> = {
  CBSE: {
    "Class 6": [
      "Mathematics",
      "Science (Physics / Chemistry / Biology)",
      "Social Science (History / Geography / Civics)",
      "English Language & Literature",
      "Hindi",
      "Sanskrit / 3rd Language",
      "Computer Science",
    ],
    "Class 7": [
      "Mathematics",
      "Science (Physics / Chemistry / Biology)",
      "Social Science (History / Geography / Civics)",
      "English Language & Literature",
      "Hindi",
      "Sanskrit / 3rd Language",
      "Computer Science",
    ],
    "Class 8": [
      "Mathematics",
      "Science (Physics / Chemistry / Biology)",
      "Social Science (History / Geography / Civics)",
      "English Language & Literature",
      "Hindi",
      "Sanskrit / 3rd Language",
      "Computer Science",
    ],
    "Class 9": [
      "Mathematics (Standard / Basic)",
      "Science (Physics / Chemistry / Biology)",
      "Social Science (History / Geography / Pol. Science / Economics)",
      "English Language & Literature",
      "Hindi Course A / B",
      "Information Technology (AI / Coding)",
    ],
    "Class 10": [
      "Mathematics (Standard / Basic)",
      "Science (Physics / Chemistry / Biology)",
      "Social Science (History / Geography / Pol. Science / Economics)",
      "English Language & Literature",
      "Hindi Course A / B",
      "Information Technology (AI / Coding)",
    ],
  },
  "State Board": {
    "Class 6": [
      "Tamil (Language)",
      "English",
      "Mathematics",
      "Science (Physics / Chemistry / Biology)",
      "Social Science (History / Geography / Civics / Economics)",
    ],
    "Class 7": [
      "Tamil (Language)",
      "English",
      "Mathematics",
      "Science (Physics / Chemistry / Biology)",
      "Social Science (History / Geography / Civics / Economics)",
    ],
    "Class 8": [
      "Tamil (Language)",
      "English",
      "Mathematics",
      "Science (Physics / Chemistry / Biology)",
      "Social Science (History / Geography / Civics / Economics)",
    ],
    "Class 9": [
      "Tamil (Language Paper I & II)",
      "English",
      "Mathematics",
      "Science (Physics / Chemistry / Biology with Practicals)",
      "Social Science (History / Geography / Civics / Economics)",
    ],
    "Class 10": [
      "Tamil (Language Paper I & II)",
      "English",
      "Mathematics",
      "Science (Physics / Chemistry / Biology with Practicals)",
      "Social Science (History / Geography / Civics / Economics)",
    ],
  },
};

/**
 * Returns the syllabus-exact subjects for any Class (6 to 10) and Board (CBSE / State Board)
 */
export function getSubjectsForClassAndBoard(
  classLevel: string = "Class 10",
  board: string = "CBSE"
): string[] {
  const normalizedBoard: SupportedBoard =
    board === "State Board" || board.toLowerCase().includes("state")
      ? "State Board"
      : "CBSE";

  const validClass = CLASS_LIST.find((c) => c === classLevel) || "Class 10";

  return CURRICULUM_DATA[normalizedBoard][validClass] || [
    "Mathematics",
    "Science",
    "English",
    "Social Science",
  ];
}

/**
 * Get unified distinct list of all subject names across the entire curriculum
 */
export function getAllUniqueSubjects(): string[] {
  const subjectsSet = new Set<string>();
  Object.values(CURRICULUM_DATA).forEach((boardClasses) => {
    Object.values(boardClasses).forEach((subjectList) => {
      subjectList.forEach((s) => subjectsSet.add(s));
    });
  });
  return Array.from(subjectsSet);
}
