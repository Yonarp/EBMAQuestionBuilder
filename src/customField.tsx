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
import {
  ProcessedQuestion,
  QuestionGroup
} from "./common/types";
import { SliderQuestion } from "./components/SliderQuestion";
import TextQuestion from "./components/TextQuestion";
import RegExQuestion from "./components/RegExQuestion";
import McqQuestion from "./components/McqQuestion";
import MultiSelectQuestion from "./components/MultiSelectQuestion";
import MatrixQuestion from "./components/MatrixQuestion";
import YesNoQuestion from "./components/YesNoQuestion";
import DropdownQuestion from "./components/DropdownQuestion";
import ImageCompareQuestion from "./components/ImageCompareQuestion";

FiveInitialize();

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
  const TextQuestionTypes = ["Text", "LongText", "Number", "Email", "Date"];

  const handleDialogOpen = async () => {
    setDialogOpen(true);
    setLoading(true);
    setCurrentGroupIndex(0);
    setAnswers({});
    setErrors({});

    const questionnaireKey = five.form?.Questionaires?.[
      "Questionaire.QuestionaireKey"
    ]
      ? five.form.Questionaires["Questionaire.QuestionaireKey"]
      : five.variable.QuestionnairesKey;
    const questionObj = { Key: questionnaireKey };

    await five.executeFunction(
      "Q200GetQuestionData",
      questionObj,
      null,
      null,
      null,
      (result) => {
        const data = JSON.parse(result.serverResponse.results);
        const rawQuestions = Array.isArray(data.questions.records)
          ? data.questions.records
          : [];
        const allAnswers = Array.isArray(data.answers.records)
          ? data.answers.records
          : [];
        const allLogicRules = Array.isArray(data.logicRules.records)
          ? data.logicRules.records
          : [];

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
            isExclusive: answer.IsExclusive,
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
          targetColumn.isExclusive = true;
          targetColumn.exclusiveType = rule.ExclusiveType || "row";
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
      const pattern = regexString.startsWith("/") ? regexString.slice(1, -1) : regexString;
      const regex = new RegExp(pattern);

      if (!regex.test(value) && value !== "") {
        setErrors((prev) => ({ ...prev, [questionKey]: errorMessage }));
      } else {
        setErrors((prev) => ({ ...prev, [questionKey]: null }));
      }
    } catch (e) {
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
    matrixType = "single"
  ) => {
    const question = questionData.find((q) => q.QuestionKey === questionKey);
    if (!question) return;

    //const isExclusiveColumn = question.MatrixColumns?.[columnIndex]?.isExclusive || false;
    const colObj = question.MatrixColumns?.[columnIndex];
    const isExclusiveColumn = colObj?.isExclusive || false;
    const exclusiveType = colObj?.exclusiveType || "row";

    setAnswers((prev) => {
      const prevMatrix = prev[questionKey] || {};
      let newMatrix = { ...prevMatrix };

      if (matrixType === "multiple") {
        // --- MULTIPLE SELECTION LOGIC ---
        const currentRow = Array.isArray(newMatrix[rowIndex])
          ? newMatrix[rowIndex]
          : [];

        if (isExclusiveColumn) {
          if (exclusiveType === "all") {
            // Select exclusive column for this row, clear other selections in this row
            newMatrix[rowIndex] = [columnIndex];
            // Optionally clear all other rows for full exclusivity:
            Object.keys(newMatrix).forEach((rIdx) => {
              if (Number(rIdx) !== rowIndex) {
                newMatrix[rIdx] = [];
              }
            });
          } else {
            // "row" exclusive: clear other selections in this row only
            newMatrix[rowIndex] = [columnIndex];
          }
        } else {
          // Remove exclusive columns if present
          const filtered = currentRow.filter(
            (idx) => !question.MatrixColumns?.[idx]?.isExclusive
          );
          // Toggle selection
          if (filtered.includes(columnIndex)) {
            newMatrix[rowIndex] = filtered.filter((idx) => idx !== columnIndex);
          } else {
            newMatrix[rowIndex] = [...filtered, columnIndex];
          }
        }
      } else {
        // --- SINGLE SELECTION LOGIC (radio) ---
        if (isExclusiveColumn) {
          if (exclusiveType === "all") {
            newMatrix = { [rowIndex]: columnIndex };
            Object.keys(newMatrix).forEach((rIdx) => {
              if (Number(rIdx) !== rowIndex) {
                newMatrix[rIdx] = null;
              }
            });
          } else {
            // "row" exclusive: clear other selections in this row only
            newMatrix[rowIndex] = columnIndex;
          }
        } else {
          // Remove exclusive selection if present
          for (const rIdx in newMatrix) {
            const cIdx = newMatrix[rIdx];
            if (question.MatrixColumns?.[cIdx]?.isExclusive) {
              delete newMatrix[rIdx];
            }
          }
          newMatrix[rowIndex] = columnIndex;
        }
      }

      return { ...prev, [questionKey]: newMatrix };

    });
  };

  const handleNumericalMatrixChange = (questionKey, rowIndex, newValue) => {
    setAnswers((prev) => {
      const prevMatrix = prev[questionKey] || {};
      const newMatrix = { ...prevMatrix, [rowIndex]: newValue };
      return { ...prev, [questionKey]: newMatrix };
    });
  };

  const handleCheckboxChange = (questionKey, optionKey, isExclusive, options) => {
    setAnswers((prev) => {
      const currentAnswers = prev[questionKey] || [];

      if (isExclusive) {
        return { ...prev, [questionKey]: [optionKey] };
      } else {
        const filteredAnswers = currentAnswers.filter(key => {
          const option = options.find(opt => opt.key === key);
          return !option || option.isExclusive !== "1";
        });

        const updatedAnswers = filteredAnswers.includes(optionKey)
          ? filteredAnswers.filter((item) => item !== optionKey)
          : [...filteredAnswers, optionKey];

        return { ...prev, [questionKey]: updatedAnswers };
      }
    });
  };

  const handleMCQChange = (questionKey, newValue, mcqOtherValue) => {
    if (newValue === "other") {

      // If switching to 'other', initialize with an empty text value
      // or preserve the old one if it exists

      const previousAnswer = answers[questionKey];
      const previousText =
        typeof previousAnswer === "object" &&
          previousAnswer.selected === "other"
          ? previousAnswer.value
          : "";

      setAnswers((prev) => ({
        ...prev,
        [questionKey]: { selected: "other", value: previousText },
      }));

    } else {
      // For any other MCQ option, just save the key
      setAnswers((prev) => ({ ...prev, [questionKey]: newValue }));
    }
  };

  const handleMCQOtherTextChange = (questionKey, textValue) => {
    // Update the text value for the 'other' option
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: { selected: "other", value: textValue },
    }));

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

  const isQuestionVisible = (question): boolean => {
    console.log("=== IS Q VISIBILE CALLED ===");
    const rulesForThisQuestion = visibilityRules.get(question.QuestionKey);
    if (!rulesForThisQuestion) {
      return question.defaultVisible;
    }

    for (const rule of rulesForThisQuestion) {
      const sourceQuestion = questionData.find(
        (q) => q.QuestionKey === rule.sourceKey
      );

      const userAnswer = answers[rule.sourceKey];
      if (!userAnswer) continue;
      // if (!userAnswer) {
      //   return Boolean(question.defaultVisible);
      // }

      let conditionMet = false;

      if (question.Question === "<div>ShowTest</div>") {
        console.log("==== source question ===");
        console.log(sourceQuestion);
      }

      if (sourceQuestion?.QuestionType === "Matrix") {
        // For Matrix questions with enhanced cell-specific logic
        conditionMet = checkMatrixConditionEnhanced(
          userAnswer,
          rule,
          sourceQuestion
        );
      } else {
        // Regular question logic
        if (Array.isArray(userAnswer)) {
          conditionMet = userAnswer.includes(rule.triggerAnswerKey);
        } else {
          conditionMet = userAnswer === rule.triggerAnswerKey;
        }
      }

      if (conditionMet) {
        if (rule.shouldShow) {
          return true;
        }

        if (!rule.shouldShow) {
          return false;
        }
      }
    }

    // if (question.Question === "<div>ShowTest</div>") {
    //   console.log("==== Visibility ===");
    //   console.log(question);
    //   console.log(question.Visibility);
    // }

    if (question.Visibility === "1") {
      return true;
    }

    return false;
  };

  // Enhanced helper function to check matrix conditions with cell-specific logic
  const checkMatrixConditionEnhanced = (matrixAnswer, rule, sourceQuestion) => {
    // Check if we have specific cell logic (MatrixRowPair + MatrixColumnPair)
    if (rule.matrixColumnPair || rule.matrixRowPair) {
      // Cell-specific logic: must match exact row + column combination
      return checkSpecificCellLogic(matrixAnswer, rule, sourceQuestion);
    } else {
      // Row or Column-only logic (backward compatibility)
      return checkRowOrColumnLogic(
        matrixAnswer,
        rule.triggerAnswerKey,
        sourceQuestion
      );
    }
  };

  // Check for specific cell intersection logic
  // New, corrected function
  const checkSpecificCellLogic = (matrixAnswer, rule, sourceQuestion) => {
    let targetRowKey = rule.matrixRowPair; // <--- CORRECTED LINE
    let targetColumnKey = rule.matrixColumnPair;

    if (!targetRowKey) {
      targetRowKey = rule.triggerAnswerKey;
    } else if (!targetColumnKey) {
      targetColumnKey = rule.triggerAnswerKey;
    }

    const targetRow = sourceQuestion.MatrixRows.find(
      (row) => row.key === targetRowKey
    );
    const targetColumn = sourceQuestion.MatrixColumns.find(
      (col) => col.key === targetColumnKey
    );

    if (!targetRow || !targetColumn) {
      return false;
    }

    const rowIndex = sourceQuestion.MatrixRows.indexOf(targetRow);
    const columnIndex = sourceQuestion.MatrixColumns.indexOf(targetColumn);
    if (rowIndex === -1 || columnIndex === -1) {
      return false;
    }

    const rowAnswer = matrixAnswer[rowIndex];

    if (rowAnswer === undefined || rowAnswer === null) {
      return false;
    }

    let isSelected = false;
    if (Array.isArray(rowAnswer)) {
      isSelected = rowAnswer.includes(columnIndex);
    } else {
      isSelected = rowAnswer === columnIndex;
    }

    return isSelected;
  };

  // Check for row-only or column-only logic (backward compatibility)
  const checkRowOrColumnLogic = (
    matrixAnswer,
    triggerAnswerKey,
    sourceQuestion
  ) => {
    for (const [rowIndex, columnSelection] of Object.entries(matrixAnswer)) {
      const row = sourceQuestion.MatrixRows[parseInt(rowIndex)];
      if (!row) continue;

      if (Array.isArray(columnSelection)) {
        // Multiple selection matrix
        for (const colIndex of columnSelection) {
          const column = sourceQuestion.MatrixColumns[colIndex];
          if (
            column &&
            (row.key === triggerAnswerKey || column.key === triggerAnswerKey)
          ) {
            return true;
          }
        }
      } else {
        // Single selection matrix
        const column = sourceQuestion.MatrixColumns[columnSelection];
        if (
          column &&
          (row.key === triggerAnswerKey || column.key === triggerAnswerKey)
        ) {
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
    const visibleQuestions = currentGroup.questions.filter((q) => {
      const result = isQuestionVisible(q);
      return typeof result === 'boolean' ? result : result?.value;
    });


    for (const question of visibleQuestions) {
      if (errors[question.QuestionKey]) {
        alert(
          `Please fix the errors before proceeding: ${errors[question.QuestionKey]
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
        const jumpTarget = checkMatrixJumpLogic(
          userAnswer,
          question.matrixJumpLogic,
          question
        );

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
          const jumpToGroupIndex =
            questionGroupKeyToIndexMap.get(targetGroupKey);
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
  const checkMatrixJumpLogic = (
    matrixAnswer,
    jumpLogicRules,
    sourceQuestion
  ) => {
    for (const rule of jumpLogicRules) {
      // Check if we have specific cell logic (MatrixRowPair + MatrixColumnPair)
      if (rule.matrixColumnPair) {
        // Cell-specific jump logic
        const targetRowKey = rule.answerKey;
        const targetColumnKey = rule.matrixColumnPair;

        // Find the row and column indexes
        const rowIndex = sourceQuestion.MatrixRows.findIndex(
          (row) => row.key === targetRowKey
        );
        const columnIndex = sourceQuestion.MatrixColumns.findIndex(
          (col) => col.key === targetColumnKey
        );

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
              return rule.jumpToGroup;
            }
          }
        }
      } else {
        // Row or Column-only jump logic (backward compatibility)
        for (const [rowIndex, columnSelection] of Object.entries(
          matrixAnswer
        )) {
          const row = sourceQuestion.MatrixRows[parseInt(rowIndex)];
          if (!row) continue;

          if (Array.isArray(columnSelection)) {
            for (const colIndex of columnSelection) {
              const column = sourceQuestion.MatrixColumns[colIndex];
              if (
                column &&
                (row.key === rule.answerKey || column.key === rule.answerKey)
              ) {
                return rule.jumpToGroup;
              }
            }
          } else {
            const column = sourceQuestion.MatrixColumns[columnSelection];
            if (
              column &&
              (row.key === rule.answerKey || column.key === rule.answerKey)
            ) {
              return rule.jumpToGroup;
            }
          }
        }
      }
    }
    return null;
  };

  const handleSubmit = () => {
    alert("Survey submitted! Check console for answers.");
    console.log("====== LOGGING ANSWERS FROM SUBMIT =====");
    console.log(answers);
    handleDialogClose();
  };

  const renderQuestion = (question, index) => {
    const questionKey = question.QuestionKey;
    const currentAnswer = answers[questionKey] || "";

    return (
      <Paper key={questionKey} elevation={1} sx={{ p: 3, mb: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h6"
            gutterBottom
            component="div"
            dangerouslySetInnerHTML={{ __html: `${question.Question}` }} // ${index + 1}.
          />
          <Chip
            label={question.QuestionType}
            size="small"
            variant="outlined"
            sx={{ mb: 2 }}
          />
        </Box>

        {TextQuestionTypes.includes(question.QuestionType) && (
          <TextQuestion
            currentAnswer={currentAnswer}
            questionKey={questionKey}
            handleAnswerChange={handleAnswerChange}
            textType={question.QuestionType}
          />
        )}

        {question.QuestionType === "RegEx" && (
          <RegExQuestion
            currentAnswer={currentAnswer}
            handleRegExChange={handleRegExChange}
            questionKey={questionKey}
            question={question}
            errors={errors}
          />
        )}

        {question.QuestionType === "MCQ" &&
          <McqQuestion
            currentAnswer={currentAnswer}
            handleMCQChange={handleMCQChange}
            question={question}
            questionKey={questionKey}
            handleMCQOtherTextChange={handleMCQOtherTextChange}
          />
        }

        {question.QuestionType === "MultiSelect" && (
          <MultiSelectQuestion
            question={question}
            currentAnswer={currentAnswer}
            questionKey={questionKey}
            handleCheckboxChange={handleCheckboxChange}
          />
        )}

        {question.QuestionType === "Matrix" && (
          <MatrixQuestion
            question={question}
            answers={answers}
            questionKey={questionKey}
            handleNumericalMatrixChange={handleNumericalMatrixChange}
            handleMatrixChange={handleMatrixChange}
          />
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
          <YesNoQuestion
            currentAnswer={currentAnswer}
            handleAnswerChange={handleAnswerChange}
            questionKey={questionKey}
            question={question}
          />
        )}

        {question.QuestionType === "Dropdown" && (
          <DropdownQuestion
            currentAnswer={currentAnswer}
            handleAnswerChange={handleAnswerChange}
            questionKey={questionKey}
            question={question}
          />
        )}

        {question.QuestionType === "ImageCompare" && (
          <ImageCompareQuestion
            currentAnswer={currentAnswer}
            handleAnswerChange={handleAnswerChange}
            questionKey={questionKey}
          />
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
                    {/* {groupedQuestions[currentGroupIndex].questions
                      .filter((q) => isQuestionVisible(q))
                      .map((question, qIndex) =>
                        renderQuestion(question, qIndex)
                    )} */}

                    {
                      groupedQuestions[currentGroupIndex].questions
                        .filter((q) => {
                          const result = isQuestionVisible(q);
                          return typeof result === 'boolean' ? result : result?.value;
                        })
                        .map((question, qIndex) => renderQuestion(question, qIndex))
                    }

                  </>
                )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          {!loading && groupedQuestions.length > 0 && (
            <>
              <Button onClick={handleBack} disabled={groupHistory.length <= 1}>
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
