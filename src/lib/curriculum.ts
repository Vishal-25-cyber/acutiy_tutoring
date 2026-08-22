/**
 * Acuity Tutoring — Curriculum & Syllabus Architecture
 * Strict syllabus alignment for CBSE (NCERT) and State Board (Samacheer Kalvi / Standard State Board)
 * Covering Class 1 to Class 10
 */

export type SupportedBoard = "CBSE" | "State Board";

export type SupportedClass =
  | "Class 1"
  | "Class 2"
  | "Class 3"
  | "Class 4"
  | "Class 5"
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
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
];

export const CURRICULUM_DATA: Record<SupportedBoard, Record<SupportedClass, string[]>> = {
  CBSE: {
    "Class 1": [
      "Mathematics",
      "English",
      "Hindi / Regional Language",
      "Environmental Studies (EVS)",
      "General Knowledge",
    ],
    "Class 2": [
      "Mathematics",
      "English",
      "Hindi / Regional Language",
      "Environmental Studies (EVS)",
      "General Knowledge",
    ],
    "Class 3": [
      "Mathematics",
      "Environmental Studies (EVS)",
      "English",
      "Hindi",
      "Computer Science Basics",
      "General Knowledge",
    ],
    "Class 4": [
      "Mathematics",
      "Environmental Studies (EVS)",
      "English",
      "Hindi",
      "Computer Science Basics",
      "General Knowledge",
    ],
    "Class 5": [
      "Mathematics",
      "Environmental Studies (EVS)",
      "English",
      "Hindi",
      "Computer Science Basics",
      "General Knowledge",
    ],
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
    "Class 1": [
      "Tamil / Regional Language",
      "English",
      "Mathematics",
      "Environmental Studies (EVS)",
    ],
    "Class 2": [
      "Tamil / Regional Language",
      "English",
      "Mathematics",
      "Environmental Studies (EVS)",
    ],
    "Class 3": [
      "Tamil / Regional Language",
      "English",
      "Mathematics",
      "Science",
      "Social Science",
    ],
    "Class 4": [
      "Tamil / Regional Language",
      "English",
      "Mathematics",
      "Science",
      "Social Science",
    ],
    "Class 5": [
      "Tamil / Regional Language",
      "English",
      "Mathematics",
      "Science",
      "Social Science",
    ],
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
 * Returns the syllabus-exact subjects for any Class (1 to 10) and Board (CBSE / State Board)
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
