export interface ProcessedQuestion {
    GroupName: string;
    GroupOrder: string;
    Question: string;
    QuestionGroupKey: string;
    QuestionKey: string;
    QuestionOrder: string;
    QuestionType: string;
    QuestionaireKey: string;
    QuestionaireName: string;
    MinRange?: number;
    MaxRange?: number;
    MinRangeText?: string;
    MaxRangeText?: string;
    LeftAnchor?: string;
    RightAnchor?: string;
    ShowSliderValue?: boolean;
    Orientation?: string;
    MatrixRows?: {
        key: string;
        text: string;
        order: number;
    }[];
    MatrixColumns?: {
        key: string;
        text: string;
        order: number;
        isExclusive?: boolean;
    }[];
    MatrixType?: "single" | "multiple" | "numerical";
    matrixJumpLogic?: {
        answerKey: string;
        matrixRowPair: string;
        matrixColumnPair: string;
        jumpToGroup: string;
        conditions: string;
    }[];
    defaultVisible: boolean;
    RegEx?: string;
    RegExMessage?: string;
    Options?: {
        key: string;
        text: string;
        order: number;
        jumpToGroup?: string;
    }[];
}
export interface QuestionGroup {
    groupName: string;
    groupOrder: number;
    questionGroupKey: string;
    questions: ProcessedQuestion[];
}
