// @ts-nocheck
import { ThemeProvider } from "@mui/system";
import React, { useState, useEffect, useMemo } from "react";
import { Button, Dialog, DialogTitle, FiveInitialize } from "./FivePluginApi";
import { CustomFieldProps } from "../../../common";
import {
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Radio,
  RadioGroup,
  Card,
  CardActionArea,
  CardMedia,
  FormLabel,
  Checkbox,
  CircularProgress,
  Chip,
  Slider,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

FiveInitialize();

// --- INTERFACES ---
interface ProcessedQuestion {
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
  MatrixRows?: { key: string; text: string; order: number }[];
  MatrixColumns?: { key: string; text: string; order: number; isExclusive?: boolean }[];
  MatrixType?: "single" | "multiple";
  matrixJumpLogic?: { 
    answerKey: string; 
    matrixRowPair: string;
    matrixColumnPair: string;
    jumpToGroup: string; 
    conditions: string 
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

interface QuestionGroup {
  groupName: string;
  groupOrder: number;
  questionGroupKey: string;
  questions: ProcessedQuestion[];
}

// --- DEDICATED SLIDER COMPONENT ---
const SliderQuestion = ({ question, initialValue, onCommitAnswer }) => {
  const min = Number(question.MinRange ?? 1);
  const max = Number(question.MaxRange ?? 10);
  const defaultValue = min;
  const [sliderValue, setSliderValue] = useState(
    typeof initialValue === "number" ? initialValue : defaultValue
  );

  useEffect(() => {
    const newInitialValue =
      typeof initialValue === "number" ? initialValue : defaultValue;
    setSliderValue(newInitialValue);
  }, [initialValue, defaultValue]);

  const handleSliderChange = (event, newValue) => {
    setSliderValue(newValue);
  };

  const handleSliderCommit = (event, finalValue) => {
    onCommitAnswer(finalValue);
  };

  return (
    <Box sx={{ px: 2 }}>
      <Typography variant="body2" gutterBottom>
        Rate from {min} to {max}
      </Typography>
      <Slider
        value={sliderValue}
        onChange={handleSliderChange}
        onChangeCommitted={handleSliderCommit}
        step={1}
        min={min}
        max={max}
        valueLabelDisplay="auto"
        marks={[
          {
            value: min,
            label: min.toString(),
          },
          {
            value: max,
            label: max.toString(),
          },
        ]}
      />
      <Box sx={{ textAlign: "center", mt: 1 }}>
        <Typography variant="body2" color="primary">
          Current value: {sliderValue}
        </Typography>
      </Box>
    </Box>
  );
};

// --- MAIN SURVEY COMPONENT ---
const CustomField = (props: CustomFieldProps) => {
  const { theme, five } = props;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [questionData, setQuestionData] = useState([]);
  const [logicRules, setLogicRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [surveyTitle, setSurveyTitle] = useState("");
  const [answers, setAnswers] = useState({});
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [errors, setErrors] = useState({});

  const handleDialogOpen = async () => {
    setDialogOpen(true);
    setLoading(true);
    setCurrentGroupIndex(0);
    setAnswers({});
    setErrors({});

    const questionnaireKey = five.form?.Questionaires?.["Questionaire.QuestionaireKey"] ? five.form.Questionaires["Questionaire.QuestionaireKey"] : five.variable.QuestionnairesKey;
    const questionObj = { Key: questionnaireKey };

    await five.executeFunction(
      "Q200GetQuestionData",
      questionObj,
      null,
      null,
      null,
      (result) => {
        const data = JSON.parse(result.serverResponse.results);
        console.log("Logging Data", data);

        const rawQuestions = Array.isArray(data.questions.records) ? data.questions.records : [];
        const allAnswers = Array.isArray(data.answers.records) ? data.answers.records : [];
        const allLogicRules = Array.isArray(data.logicRules.records) ? data.logicRules.records : [];

        setLogicRules(allLogicRules);
        const processed = processAndMergeData(
          rawQuestions,
          allAnswers,
          allLogicRules
        );
        setQuestionData(processed);

        if (processed.length > 0) {
          setSurveyTitle(processed[0].QuestionaireName);
        }
        setLoading(false);
      }
    );
  };

const processAndMergeData = (rawQuestions, allAnswers, allLogicRules) => {
    const questionMap = new Map();

    // 1. Initialize questions
    rawQuestions.forEach((item) => {
      if (item.QuestionKey && !questionMap.has(item.QuestionKey)) {
        questionMap.set(item.QuestionKey, {
          ...item,
          Options: [],
          MatrixRows: [],
          MatrixColumns: [],
          defaultVisible: item.Visibility !== "0",
        });
      }
    });

    // 2. Process answers and categorize them
    (allAnswers || []).forEach((answer) => {
      const question = questionMap.get(answer.QuestionKey);
      if (question) {
        if (question.QuestionType === "Matrix") {
          if (answer.MatrixType === "row") {
            question.MatrixRows.push({
              key: answer.AnswerKey,
              text: answer.Answer,
              order: parseInt(answer.MatrixRowOrder || "0"),
            });
          } else if (answer.MatrixType === "column") {
            question.MatrixColumns.push({
              key: answer.AnswerKey,
              text: answer.Answer,
              order: parseInt(answer.MatrixColumnOrder || "0"),
              // Note: We can't determine isExclusive here yet, as the flag
              // is incorrectly located in logicRules. We'll do it in a later step.
              isExclusive: false, 
            });
          }
        } else {
          question.Options.push({
            key: answer.AnswerKey,
            text: answer.Answer,
            order: parseInt(answer.AnswerOrder || "0"),
          });
        }
      }
    });

    // 3. Process logic rules for jumps AND to find the misplaced exclusive flag
    allLogicRules.forEach((rule) => {
      const sourceQuestion = questionMap.get(rule.QuestionKey);
      if (!sourceQuestion) return;

      // --- FIX FOR EXCLUSIVE FLAG ---
      // Check if this rule defines a column as exclusive
      if (
        sourceQuestion.QuestionType === "Matrix" &&
        (rule.MatrixExcludeCell === "1" || rule.MatrixExcludeCell === 1) &&
        rule.MatrixColumnPair
      ) {
        // Find the column in our question that this rule applies to
        const targetColumn = sourceQuestion.MatrixColumns.find(
          (col) => col.key === rule.MatrixColumnPair
        );
        if (targetColumn) {
          console.log(`Found exclusive column from logic rule: ${targetColumn.text}`);
          targetColumn.isExclusive = true;
        }
      }

      // --- Process JUMP logic (as before) ---
      if (rule.Action === "JUMP") {
        if (sourceQuestion.QuestionType === "Matrix") {
          if (!sourceQuestion.matrixJumpLogic) {
            sourceQuestion.matrixJumpLogic = [];
          }
          sourceQuestion.matrixJumpLogic.push({
            answerKey: rule.AnswerKey,
            matrixRowPair: rule.MatrixRowPair || "",
            matrixColumnPair: rule.MatrixColumnPair || "",
            jumpToGroup: rule.NextQuestionGroup,
            conditions: rule.Conditions || "",
          });
        } else {
          if (sourceQuestion.Options) {
            const targetOption = sourceQuestion.Options.find(
              (opt) => opt.key === rule.AnswerKey
            );
            if (targetOption) {
              targetOption.jumpToGroup = rule.NextQuestionGroup;
            }
          }
        }
      }
    });

    // 4. Sort all arrays by their respective order fields
    questionMap.forEach((q) => {
      q.Options?.sort((a, b) => a.order - b.order);
      q.MatrixRows?.sort((a, b) => a.order - b.order);
      q.MatrixColumns?.sort((a, b) => a.order - b.order);
    });

    return Array.from(questionMap.values());
  };

  const handleDialogClose = () => setDialogOpen(false);

  const handleAnswerChange = (questionKey, value) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: value }));
  };

  const handleRegExChange = (questionKey, value, regexString, errorMessage) => {
    handleAnswerChange(questionKey, value);

    if (!regexString) return;

    try {
      const pattern = regexString.startsWith("/")
        ? regexString.slice(1, -1)
        : regexString;
      const regex = new RegExp(pattern);

      if (!regex.test(value) && value !== "") {
        setErrors((prev) => ({ ...prev, [questionKey]: errorMessage }));
      } else {
        setErrors((prev) => ({ ...prev, [questionKey]: null }));
      }
    } catch (e) {
      console.error("Invalid RegEx pattern provided:", regexString);
      setErrors((prev) => ({
        ...prev,
        [questionKey]: "Invalid validation rule.",
      }));
    }
  };

  const handleMatrixChange = (
    questionKey,
    rowIndex,
    columnIndex,
    matrixType = "single" // This logic is primarily for single-select as requested
  ) => {
    const question = questionData.find((q) => q.QuestionKey === questionKey);
    if (!question) return;

    const isExclusiveColumn =
      question.MatrixColumns?.[columnIndex]?.isExclusive || false;

    setAnswers((prev) => {
      const prevMatrix = prev[questionKey] || {};
      let newMatrix;

      // --- 1. LOGIC FOR EXCLUSIVE SELECTIONS ---
      // If the user clicks a cell in a column marked as "exclusive".
      if (isExclusiveColumn) {
        // Check if this exact exclusive cell is ALREADY the only thing selected.
        // If so, the user is clicking it again to DESELECT it.
        if (
          Object.keys(prevMatrix).length === 1 &&
          prevMatrix[rowIndex] === columnIndex
        ) {
          // Clear the entire matrix answer, leaving it empty.
          newMatrix = {};
          console.log("Deselected the exclusive option. Matrix is now empty.");
        } else {
          // Otherwise, select this exclusive option and clear everything else.
          // This is the "nuke" operation that clears all other rows.
          newMatrix = { [rowIndex]: columnIndex };
          console.log(
            "Selected exclusive option. All other matrix answers cleared."
          );
        }
      }
      // --- 2. LOGIC FOR STANDARD (NON-EXCLUSIVE) SELECTIONS ---
      else {
        // Start with a copy of the previous answers for this matrix.
        newMatrix = { ...prevMatrix };

        // **Crucial Step:** Before setting the new answer, we must check for
        // and REMOVE any existing exclusive selection from the entire matrix.
        // This prevents an exclusive and non-exclusive answer from co-existing.
        for (const rIdx in newMatrix) {
          const cIdx = newMatrix[rIdx];
          // If a selected answer is in an exclusive column, delete it.
          if (question.MatrixColumns?.[cIdx]?.isExclusive) {
            console.log("Clearing previously selected exclusive option.");
            delete newMatrix[rIdx];
          }
        }

        // Now, set the new standard (non-exclusive) selection for the current row.
        // For a single-select matrix, this will add/update the selection for this row.
        newMatrix[rowIndex] = columnIndex;
        console.log(`Set standard selection for row ${rowIndex}.`);
      }

      console.log("Final new matrix answer:", newMatrix);
      return { ...prev, [questionKey]: newMatrix };
    });
  };

  const handleCheckboxChange = (questionKey, optionKey) => {
    setAnswers((prev) => {
      const currentAnswers = prev[questionKey] || [];
      const updatedAnswers = currentAnswers.includes(optionKey)
        ? currentAnswers.filter((item) => item !== optionKey)
        : [...currentAnswers, optionKey];
      return { ...prev, [questionKey]: updatedAnswers };
    });
  };

  const groupedQuestions = useMemo(() => {
    if (questionData.length === 0) return [];
    const groups = {};
    questionData.forEach((question) => {
      if (!groups[question.QuestionGroupKey]) {
        groups[question.QuestionGroupKey] = {
          groupName: question.GroupName,
          groupOrder: parseInt(question.GroupOrder),
          questionGroupKey: question.QuestionGroupKey,
          questions: [],
        };
      }
      groups[question.QuestionGroupKey].questions.push(question);
    });
    Object.values(groups).forEach((group) => {
      group.questions.sort(
        (a, b) => parseInt(a.QuestionOrder) - parseInt(b.QuestionOrder)
      );
    });
    return Object.values(groups).sort((a, b) => a.groupOrder - b.groupOrder);
  }, [questionData]);

  const visibilityRules = useMemo(() => {
  const map = new Map();
  const showHideRules = Array.isArray(logicRules) ? logicRules.filter((r) => r.Action === "SHOW_HIDE") : [];
  showHideRules.forEach((rule) => {
    const targetKey = rule.NextQuestion;
    if (!map.has(targetKey)) {
      map.set(targetKey, []);
    }
    map.get(targetKey).push({
      sourceKey: rule.QuestionKey,
      triggerAnswerKey: rule.AnswerKey,
      matrixRowPair: rule.MatrixRowPair || "",
      matrixColumnPair: rule.MatrixColumnPair || "",
      shouldShow: rule.Visibility.toLowerCase() === "show",
    });
  });
  return map;
}, [logicRules]);

  const isQuestionVisible = (question) => {
    const rulesForThisQuestion = visibilityRules.get(question.QuestionKey);
    console.log(`Checking visibility for question ${question.QuestionKey}:`, { 
      rules: rulesForThisQuestion, 
      defaultVisible: question.defaultVisible 
    });
    
    if (!rulesForThisQuestion) {
      return question.defaultVisible;
    }
    
    for (const rule of rulesForThisQuestion) {
      const sourceQuestion = questionData.find(q => q.QuestionKey === rule.sourceKey);
      const userAnswer = answers[rule.sourceKey];
      
      console.log("Checking rule:", { rule, sourceQuestion: sourceQuestion?.QuestionType, userAnswer });
      
      if (!userAnswer) continue;
      
      let conditionMet = false;
      
      if (sourceQuestion?.QuestionType === "Matrix") {
        // For Matrix questions with enhanced cell-specific logic
        conditionMet = checkMatrixConditionEnhanced(userAnswer, rule, sourceQuestion);
      } else {
        // Regular question logic
        if (Array.isArray(userAnswer)) {
          conditionMet = userAnswer.includes(rule.triggerAnswerKey);
        } else {
          conditionMet = userAnswer === rule.triggerAnswerKey;
        }
      }
      
      console.log("Condition result:", { conditionMet, shouldShow: rule.shouldShow });
      
      if (conditionMet && rule.shouldShow) {
        return true;
      }
    }
    return false;
  };

  // Enhanced helper function to check matrix conditions with cell-specific logic
  const checkMatrixConditionEnhanced = (matrixAnswer, rule, sourceQuestion) => {
    console.log("Checking matrix condition:", { matrixAnswer, rule, sourceQuestion });
    
    // Check if we have specific cell logic (MatrixRowPair + MatrixColumnPair)
    if (rule.matrixColumnPair) {
      // Cell-specific logic: must match exact row + column combination
      return checkSpecificCellLogic(matrixAnswer, rule, sourceQuestion);
    } else {
      // Row or Column-only logic (backward compatibility)
      return checkRowOrColumnLogic(matrixAnswer, rule.triggerAnswerKey, sourceQuestion);
    }
  };

  // Check for specific cell intersection logic
  // New, corrected function
  const checkSpecificCellLogic = (matrixAnswer, rule, sourceQuestion) => {
    const targetRowKey = rule.matrixRowPair; // <--- CORRECTED LINE
    const targetColumnKey = rule.matrixColumnPair;
    
    console.log("=== CELL LOGIC CHECK ===");
    console.log("Target keys:", { targetRowKey, targetColumnKey });
    console.log("Matrix answer:", matrixAnswer);
    console.log("Question rows:", sourceQuestion.MatrixRows);
    console.log("Question columns:", sourceQuestion.MatrixColumns);

    const targetRow = sourceQuestion.MatrixRows.find(row => row.key === targetRowKey);
    const targetColumn = sourceQuestion.MatrixColumns.find(col => col.key === targetColumnKey);
    
    console.log("Found target row:", targetRow);
    console.log("Found target column:", targetColumn);

    if (!targetRow || !targetColumn) {
      console.log("❌ Row or column not found");
      return false;
    }
    
    const rowIndex = sourceQuestion.MatrixRows.indexOf(targetRow);
    const columnIndex = sourceQuestion.MatrixColumns.indexOf(targetColumn);
    
    console.log("UI indexes:", { rowIndex, columnIndex });

    if (rowIndex === -1 || columnIndex === -1) {
      console.log("❌ Row or column index not found");
      return false;
    }

    const rowAnswer = matrixAnswer[rowIndex];
    console.log(`Row ${rowIndex} answer:`, rowAnswer);

    if (rowAnswer === undefined || rowAnswer === null) {
      console.log("❌ No answer for this row");
      return false;
    }

    let isSelected = false;
    if (Array.isArray(rowAnswer)) {
      isSelected = rowAnswer.includes(columnIndex);
    } else {
      isSelected = rowAnswer === columnIndex;
    }
    
    console.log(`✅ Cell logic result: ${isSelected}`);
    console.log("=== END CELL LOGIC CHECK ===");

    return isSelected;
  };

  // Check for row-only or column-only logic (backward compatibility)
  const checkRowOrColumnLogic = (matrixAnswer, triggerAnswerKey, sourceQuestion) => {
    for (const [rowIndex, columnSelection] of Object.entries(matrixAnswer)) {
      const row = sourceQuestion.MatrixRows[parseInt(rowIndex)];
      if (!row) continue;
      
      if (Array.isArray(columnSelection)) {
        // Multiple selection matrix
        for (const colIndex of columnSelection) {
          const column = sourceQuestion.MatrixColumns[colIndex];
          if (column && (row.key === triggerAnswerKey || column.key === triggerAnswerKey)) {
            return true;
          }
        }
      } else {
        // Single selection matrix
        const column = sourceQuestion.MatrixColumns[columnSelection];
        if (column && (row.key === triggerAnswerKey || column.key === triggerAnswerKey)) {
          return true;
        }
      }
    }
    return false;
  };

  const questionGroupKeyToIndexMap = useMemo(() => {
    const map = new Map();
    groupedQuestions.forEach((group, index) => {
      map.set(group.questionGroupKey, index);
    });
    return map;
  }, [groupedQuestions]);

  const [groupHistory, setGroupHistory] = useState([0]);
  
  const handleBack = () => {
    setGroupHistory((prev) => {
      if (prev.length <= 1) return prev;
      const newHistory = prev.slice(0, -1);
      setCurrentGroupIndex(newHistory[newHistory.length - 1]);
      return newHistory;
    });
  };

  const handleNext = () => {
    const currentGroup = groupedQuestions[currentGroupIndex];
    const visibleQuestions = currentGroup.questions.filter((q) =>
      isQuestionVisible(q)
    );

    for (const question of visibleQuestions) {
      if (errors[question.QuestionKey]) {
        alert(
          `Please fix the errors before proceeding: ${
            errors[question.QuestionKey]
          }`
        );
        return;
      }
    }

    let nextGroupIndex = currentGroupIndex + 1;
    
    // Check for jump logic in current group questions
    for (const question of currentGroup.questions) {
      const userAnswer = answers[question.QuestionKey];
      
      if (!userAnswer) continue;
      
      if (question.QuestionType === "Matrix" && question.matrixJumpLogic) {
        // Handle Matrix jump logic
        const jumpTarget = checkMatrixJumpLogic(userAnswer, question.matrixJumpLogic, question);
        if (jumpTarget) {
          const jumpToGroupIndex = questionGroupKeyToIndexMap.get(jumpTarget);
          if (jumpToGroupIndex !== undefined) {
            nextGroupIndex = jumpToGroupIndex;
            break;
          }
        }
      } else if (question.Options) {
        // Handle regular MCQ jump logic
        const selectedOption = question.Options.find(
          (opt) => opt.key === userAnswer
        );
        if (selectedOption?.jumpToGroup) {
          const targetGroupKey = selectedOption.jumpToGroup;
          const jumpToGroupIndex = questionGroupKeyToIndexMap.get(targetGroupKey);
          if (jumpToGroupIndex !== undefined) {
            nextGroupIndex = jumpToGroupIndex;
            break;
          }
        }
      }
    }
    
    if (nextGroupIndex >= groupedQuestions.length) {
      handleSubmit();
    } else {
      setCurrentGroupIndex(nextGroupIndex);
      setGroupHistory((prev) => [...prev, nextGroupIndex]);
    }
  };

  // Enhanced helper function to check matrix jump logic with cell-specific logic
  const checkMatrixJumpLogic = (matrixAnswer, jumpLogicRules, sourceQuestion) => {
    for (const rule of jumpLogicRules) {
      console.log("Checking jump rule:", rule);
      
      // Check if we have specific cell logic (MatrixRowPair + MatrixColumnPair)
      if (rule.matrixColumnPair) {
        // Cell-specific jump logic
        const targetRowKey = rule.answerKey;
        const targetColumnKey = rule.matrixColumnPair;
        
        // Find the row and column indexes
        const rowIndex = sourceQuestion.MatrixRows.findIndex(row => row.key === targetRowKey);
        const columnIndex = sourceQuestion.MatrixColumns.findIndex(col => col.key === targetColumnKey);
        
        if (rowIndex !== -1 && columnIndex !== -1) {
          const rowAnswer = matrixAnswer[rowIndex];
          if (rowAnswer !== undefined) {
            let cellSelected = false;
            if (Array.isArray(rowAnswer)) {
              cellSelected = rowAnswer.includes(columnIndex);
            } else {
              cellSelected = rowAnswer === columnIndex;
            }
            
            if (cellSelected) {
              console.log("Jump triggered by cell selection");
              return rule.jumpToGroup;
            }
          }
        }
      } else {
        // Row or Column-only jump logic (backward compatibility)
        for (const [rowIndex, columnSelection] of Object.entries(matrixAnswer)) {
          const row = sourceQuestion.MatrixRows[parseInt(rowIndex)];
          if (!row) continue;
          
          if (Array.isArray(columnSelection)) {
            for (const colIndex of columnSelection) {
              const column = sourceQuestion.MatrixColumns[colIndex];
              if (column && (row.key === rule.answerKey || column.key === rule.answerKey)) {
                return rule.jumpToGroup;
              }
            }
          } else {
            const column = sourceQuestion.MatrixColumns[columnSelection];
            if (column && (row.key === rule.answerKey || column.key === rule.answerKey)) {
              return rule.jumpToGroup;
            }
          }
        }
      }
    }
    return null;
  };

  const handleSubmit = () => {
    console.log("Survey Answers:", answers);
    alert("Survey submitted! Check console for answers.");
    handleDialogClose();
  };

  const renderQuestion = (question, index) => {
    const questionKey = question.QuestionKey;
    const currentAnswer = answers[questionKey] || "";

    return (
      <Paper key={questionKey} elevation={1} sx={{ p: 3, mb: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            {index + 1}. {question.Question}
          </Typography>
          <Chip
            label={question.QuestionType}
            size="small"
            variant="outlined"
            sx={{ mb: 2 }}
          />
        </Box>

        {question.QuestionType === "Text" && (
          <TextField
            fullWidth
            placeholder="Enter your answer..."
            variant="outlined"
            size="small"
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
          />
        )}

        {question.QuestionType === "LongText" && (
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Enter your detailed answer..."
            variant="outlined"
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
          />
        )}

        {question.QuestionType === "RegEx" && (
          <TextField
            fullWidth
            placeholder="Enter your answer..."
            variant="outlined"
            size="small"
            value={currentAnswer}
            onChange={(e) =>
              handleRegExChange(
                questionKey,
                e.target.value,
                question.RegEx,
                question.RegExMessage
              )
            }
            error={!!errors[questionKey]}
            helperText={errors[questionKey] || ""}
          />
        )}

        {question.QuestionType === "MCQ" && (
          <FormControl component="fieldset">
            <FormLabel component="legend">Select one option:</FormLabel>
            <RadioGroup
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
            >
              {question.Options?.map((option) => (
                <FormControlLabel
                  key={option.key}
                  value={option.key}
                  control={<Radio />}
                  label={option.text}
                />
              ))}
            </RadioGroup>
          </FormControl>
        )}

        {question.QuestionType === "MultiSelect" && (
          <FormControl component="fieldset">
            <FormLabel component="legend">Select all that apply:</FormLabel>
            {question.Options?.map((option) => (
              <FormControlLabel
                key={option.key}
                control={
                  <Checkbox
                    checked={(currentAnswer || []).includes(option.key)}
                    onChange={() =>
                      handleCheckboxChange(questionKey, option.key)
                    }
                  />
                }
                label={option.text}
              />
            ))}
          </FormControl>
        )}

        {question.QuestionType === "Matrix" && (
          <Box>
            <Typography variant="body2" gutterBottom color="text.secondary">
              {question.MatrixType === "multiple" 
                ? "Select all that apply for each row:" 
                : "Select one option for each row:"
              }
            </Typography>
            {question.MatrixRows?.length > 0 && question.MatrixColumns?.length > 0 ? (
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold", bgcolor: "grey.50" }} />
                      {question.MatrixColumns.map((col) => (
                        <TableCell 
                          key={col.key} 
                          align="center" 
                          sx={{ 
                            fontWeight: "bold", 
                            bgcolor: col.isExclusive ? "orange.50" : "grey.50",
                            borderLeft: col.isExclusive ? "3px solid orange" : "none"
                          }}
                        >
                          {col.text}
                          {col.isExclusive && (
                            <Typography variant="caption" display="block" color="orange.main">
                              (Exclusive)
                            </Typography>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {question.MatrixRows.map((row, rIdx) => (
                      <TableRow key={row.key} hover>
                        <TableCell sx={{ fontWeight: "medium" }}>{row.text}</TableCell>
                        {question.MatrixColumns.map((col, cIdx) => (
                          <TableCell 
                            key={col.key} 
                            align="center"
                            sx={{ 
                              bgcolor: col.isExclusive ? "orange.25" : "inherit"
                            }}
                          >
                            {question.MatrixType === "multiple" ? (
                              <Checkbox
                                checked={(((answers[questionKey] || {})[rIdx] || [])).includes(cIdx)}
                                onChange={() => handleMatrixChange(questionKey, rIdx, cIdx, "multiple")}
                                sx={{
                                  color: col.isExclusive ? "orange.main" : "inherit",
                                  '&.Mui-checked': {
                                    color: col.isExclusive ? "orange.main" : "primary.main"
                                  }
                                }}
                              />
                            ) : (
                              <Radio
                                checked={(answers[questionKey] || {})[rIdx] === cIdx}
                                onChange={() => handleMatrixChange(questionKey, rIdx, cIdx, "single")}
                                name={`matrix-${questionKey}-row-${rIdx}`}
                                sx={{
                                  color: col.isExclusive ? "orange.main" : "inherit",
                                  '&.Mui-checked': {
                                    color: col.isExclusive ? "orange.main" : "primary.main"
                                  }
                                }}
                              />
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="warning.main" variant="body2">
                Matrix question is missing rows or columns. Please check your data.
                <br />
                Debug: Rows: {question.MatrixRows?.length || 0}, Columns: {question.MatrixColumns?.length || 0}
              </Typography>
            )}
          </Box>
        )}

        {question.QuestionType === "Rating" && (
          <SliderQuestion
            question={question}
            initialValue={currentAnswer}
            onCommitAnswer={(newValue) =>
              handleAnswerChange(questionKey, newValue)
            }
          />
        )}

        {question.QuestionType === "YesNo" && (
          <FormControl component="fieldset">
            <RadioGroup
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
              row
            >
              <FormControlLabel value="yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="no" control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>
        )}

        {question.QuestionType === "Number" && (
          <TextField
            type="number"
            placeholder="Enter a number..."
            variant="outlined"
            size="small"
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
          />
        )}

        {question.QuestionType === "Email" && (
          <TextField
            type="email"
            placeholder="Enter your email..."
            variant="outlined"
            size="small"
            fullWidth
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
          />
        )}

        {question.QuestionType === "Date" && (
          <TextField
            type="date"
            variant="outlined"
            size="small"
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        )}

        {question.QuestionType === "Dropdown" && (
          <FormControl fullWidth size="small">
            <InputLabel>Select an option</InputLabel>
            <Select
              value={currentAnswer}
              label="Select an option"
              onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
            >
              {question.Options?.map((option) => (
                <MenuItem key={option.key} value={option.key}>
                  {option.text}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {question.QuestionType === "ImageCompare" && (
          <Box>
            <Typography variant="body2" gutterBottom>
              Choose an image
            </Typography>
            {[
              {
                id: "left",
                label: "Image A",
                src: "https://picsum.photos/seed/a/400/250",
              },
              {
                id: "right",
                label: "Image B",
                src: "https://picsum.photos/seed/b/400/250",
              },
            ].map((opt) => (
              <Card
                key={opt.id}
                sx={{
                  mb: 2,
                  border:
                    currentAnswer === opt.id
                      ? "3px solid #1976d2"
                      : "1px solid #e0e0e0",
                }}
              >
                <CardActionArea
                  onClick={() => handleAnswerChange(questionKey, opt.id)}
                >
                  <CardMedia
                    component="img"
                    height="250"
                    image={opt.src}
                    alt={opt.label}
                  />
                  <Box sx={{ p: 1, textAlign: "center" }}>
                    <Typography>{opt.label}</Typography>
                  </Box>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        )}
      </Paper>
    );
  };

  const isLastGroup = currentGroupIndex >= groupedQuestions.length - 1;

  return (
    <ThemeProvider theme={theme}>
      <Button onClick={handleDialogOpen}>View Survey</Button>
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>{surveyTitle || "Survey"}</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ mb: 3 }}>
              {groupedQuestions.length > 0 &&
                groupedQuestions[currentGroupIndex] && (
                  <>
                    <Typography
                      variant="h5"
                      gutterBottom
                      sx={{ color: "primary.main" }}
                    >
                      {groupedQuestions[currentGroupIndex].groupName}
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    {groupedQuestions[currentGroupIndex].questions
                      .filter((q) => isQuestionVisible(q))
                      .map((question, qIndex) =>
                        renderQuestion(question, qIndex)
                      )}
                  </>
                )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          {!loading && groupedQuestions.length > 0 && (
            <>
              <Button
                onClick={handleBack}
                disabled={groupHistory.length <= 1}
              >
                Back
              </Button>
              <Button variant="contained" onClick={handleNext}>
                {isLastGroup ? "Submit Survey" : "Next"}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default CustomField;
