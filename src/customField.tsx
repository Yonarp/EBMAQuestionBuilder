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
  MatrixRows?: string[];
  MatrixColumns?: string[];
  MatrixType?: "single" | "multiple";
  defaultVisible: boolean;
  Options?: {
    key: string;
    text: string;
    order: number;
    jumpTo?: string;
  }[];
}

interface QuestionGroup {
  groupName: string;
  groupOrder: number;
  questions: ProcessedQuestion[];
}

// --- DEDICATED SLIDER COMPONENT ---
const SliderQuestion = ({ question, initialValue, onCommitAnswer }) => {
  const defaultValue = question.MinRange ?? 1;
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
        Rate from {question.MinRange || 1} to {question.MaxRange || 10}
      </Typography>
      <Slider
        value={sliderValue}
        onChange={handleSliderChange}
        onChangeCommitted={handleSliderCommit}
        step={1}
        min={question.MinRange || 1}
        max={question.MaxRange || 10}
        valueLabelDisplay="auto"
        marks={[
          {
            value: question.MinRange || 1,
            label: (question.MinRange || 1).toString(),
          },
          {
            value: question.MaxRange || 10,
            label: (question.MaxRange || 10).toString(),
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

  const handleDialogOpen = async () => {
    setDialogOpen(true);
    setLoading(true);
    setCurrentGroupIndex(0);
    setAnswers({});

    const questionnaireKey =
      five.form.Questionaires["Questionaire.QuestionaireKey"];
    const questionObj = { Key: questionnaireKey };

    await five.executeFunction(
      "Q200GetQuestionData",
      questionObj, null, null, null,
      (result) => {
        const data = JSON.parse(result.serverResponse.results);
        
        const rawQuestions = data.questions.records;
        const allAnswers = data.answers.records;
        const allLogicRules = data.logicRules.records;

        setLogicRules(allLogicRules);
        const processed = processAndMergeData(rawQuestions, allAnswers, allLogicRules);
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

    rawQuestions.forEach((item) => {
      if (item.QuestionKey && !questionMap.has(item.QuestionKey)) {
        questionMap.set(item.QuestionKey, {
          ...item,
          Options: [],
          defaultVisible: item.Visibility !== "0",
        });
      }
    });

    allAnswers.forEach((answer) => {
      const question = questionMap.get(answer.QuestionKey);
      if (question) {
        question.Options.push({
          key: answer.AnswerKey,
          text: answer.Answer,
          order: parseInt(answer.AnswerOrder || "0"),
        });
      }
    });

    const jumpRules = allLogicRules.filter(r => r.Action === 'JUMP');
    jumpRules.forEach((rule) => {
      const sourceQuestion = questionMap.get(rule.QuestionKey);
      if (sourceQuestion?.Options) {
        const targetOption = sourceQuestion.Options.find(opt => opt.key === rule.AnswerKey);
        if (targetOption) {
          targetOption.jumpTo = rule.NextQuestion;
        }
      }
    });

    questionMap.forEach((q) => q.Options?.sort((a, b) => a.order - b.order));
    
    return Array.from(questionMap.values());
  };

  const handleDialogClose = () => setDialogOpen(false);

  const handleAnswerChange = (questionKey, value) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: value }));
  };

  const handleMatrixChange = (
    questionKey,
    rowIndex,
    columnIndex,
    matrixType = "single"
  ) => {
    setAnswers((prev) => {
      const currentMatrix = prev[questionKey] || {};
      if (matrixType === "multiple") {
        const currentRow = currentMatrix[rowIndex] || [];
        const updatedRow = currentRow.includes(columnIndex)
          ? currentRow.filter((col) => col !== columnIndex)
          : [...currentRow, columnIndex];
        return {
          ...prev,
          [questionKey]: { ...currentMatrix, [rowIndex]: updatedRow },
        };
      } else {
        return {
          ...prev,
          [questionKey]: { ...currentMatrix, [rowIndex]: columnIndex },
        };
      }
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
          questions: [],
        };
      }
      groups[question.QuestionGroupKey].questions.push(question);
    });
    Object.values(groups).forEach((group) => {
      group.questions.sort((a, b) => parseInt(a.QuestionOrder) - parseInt(b.QuestionOrder));
    });
    return Object.values(groups).sort((a, b) => a.groupOrder - b.groupOrder);
  }, [questionData]);

  const visibilityRules = useMemo(() => {
    const map = new Map();
    const showHideRules = logicRules.filter(r => r.Action === 'SHOW_HIDE');
    showHideRules.forEach(rule => {
      const targetKey = rule.NextQuestion;
      if (!map.has(targetKey)) {
        map.set(targetKey, []);
      }
      map.get(targetKey).push({
        sourceKey: rule.QuestionKey,
        triggerAnswerKey: rule.AnswerKey,
        shouldShow: rule.Visibility.toLowerCase() === 'show',
      });
    });
    return map;
  }, [logicRules]);

  const isQuestionVisible = (question) => {
    const rulesForThisQuestion = visibilityRules.get(question.QuestionKey);
    if (!rulesForThisQuestion) {
      return question.defaultVisible;
    }
    for (const rule of rulesForThisQuestion) {
      const userAnswer = answers[rule.sourceKey];
      if (userAnswer && userAnswer === rule.triggerAnswerKey && rule.shouldShow) {
        return true;
      }
    }
    return false;
  };

  const questionKeyToGroupIndexMap = useMemo(() => {
    const map = new Map();
    groupedQuestions.forEach((group, index) => {
      group.questions.forEach((q) => {
        map.set(q.QuestionKey, index);
      });
    });
    return map;
  }, [groupedQuestions]);

  const handleNext = () => {
    const currentGroup = groupedQuestions[currentGroupIndex];
    let nextGroupIndex = currentGroupIndex + 1;
    for (const question of currentGroup.questions) {
      const userAnswerKey = answers[question.QuestionKey];
      if (userAnswerKey && question.Options) {
        const selectedOption = question.Options.find(opt => opt.key === userAnswerKey);
        if (selectedOption?.jumpTo) {
          const jumpToGroupIndex = questionKeyToGroupIndexMap.get(selectedOption.jumpTo);
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
    }
  };

  const handleSubmit = () => {
    console.log("Survey Answers:", answers);
    alert("Survey submitted! Check console for answers.");
    handleDialogClose();
  };

  const renderQuestion = (question, index) => {
    const questionKey = question.QuestionKey;
    const currentAnswer = answers[questionKey] || "";

    // --- FIX: Define static data for the Matrix here ---
    const staticMatrixColumns = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
    const staticMatrixRows = ["Service Quality", "Product Value", "Customer Support"];

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
        {question.QuestionType === "Text" && <TextField fullWidth placeholder="Enter your answer..." variant="outlined" size="small" value={currentAnswer} onChange={(e) => handleAnswerChange(questionKey, e.target.value)} />}
        {question.QuestionType === "LongText" && <TextField fullWidth multiline rows={3} placeholder="Enter your detailed answer..." variant="outlined" value={currentAnswer} onChange={(e) => handleAnswerChange(questionKey, e.target.value)} />}
        {question.QuestionType === "MCQ" && (
            <FormControl component="fieldset">
                <FormLabel component="legend">Select one option:</FormLabel>
                <RadioGroup value={currentAnswer} onChange={(e) => handleAnswerChange(questionKey, e.target.value)}>
                    {question.Options?.map(option => <FormControlLabel key={option.key} value={option.key} control={<Radio />} label={option.text} />)}
                </RadioGroup>
            </FormControl>
        )}
        {question.QuestionType === "MultiSelect" && (
            <FormControl component="fieldset">
                <FormLabel component="legend">Select all that apply:</FormLabel>
                {question.Options?.map(option => <FormControlLabel key={option.key} control={<Checkbox checked={(currentAnswer || []).includes(option.key)} onChange={() => handleCheckboxChange(questionKey, option.key)} />} label={option.text} />)}
            </FormControl>
        )}
        {question.QuestionType === "Matrix" && (
            <Box>
                <Typography variant="body2" gutterBottom color="text.secondary">{question.MatrixType === "multiple" ? "Select all that apply for each row:" : "Select one option for each row:"}</Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: "bold", bgcolor: "grey.50" }} />
                                {/* --- FIX: Use static columns --- */}
                                {staticMatrixColumns.map((col, i) => <TableCell key={i} align="center" sx={{ fontWeight: "bold", bgcolor: "grey.50" }}>{col}</TableCell>)}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {/* --- FIX: Use static rows --- */}
                            {staticMatrixRows.map((row, rIdx) => (
                                <TableRow key={rIdx} hover>
                                    <TableCell sx={{ fontWeight: "medium" }}>{row}</TableCell>
                                    {staticMatrixColumns.map((_, cIdx) => (
                                        <TableCell key={cIdx} align="center">
                                            {question.MatrixType === "multiple" ?
                                                <Checkbox checked={(((answers[questionKey] || {})[rIdx] || [])).includes(cIdx)} onChange={() => handleMatrixChange(questionKey, rIdx, cIdx, "multiple")} /> :
                                                <Radio checked={(answers[questionKey] || {})[rIdx] === cIdx} onChange={() => handleMatrixChange(questionKey, rIdx, cIdx, "single")} name={`matrix-${questionKey}-row-${rIdx}`} />
                                            }
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        )}
        {question.QuestionType === "Rating" && <SliderQuestion question={question} initialValue={currentAnswer} onCommitAnswer={newValue => handleAnswerChange(questionKey, newValue)} />}
        {question.QuestionType === "YesNo" && (
            <FormControl component="fieldset">
                <RadioGroup value={currentAnswer} onChange={(e) => handleAnswerChange(questionKey, e.target.value)} row>
                    <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                    <FormControlLabel value="no" control={<Radio />} label="No" />
                </RadioGroup>
            </FormControl>
        )}
        {question.QuestionType === "Number" && <TextField type="number" placeholder="Enter a number..." variant="outlined" size="small" value={currentAnswer} onChange={(e) => handleAnswerChange(questionKey, e.target.value)} />}
        {question.QuestionType === "Email" && <TextField type="email" placeholder="Enter your email..." variant="outlined" size="small" fullWidth value={currentAnswer} onChange={(e) => handleAnswerChange(questionKey, e.target.value)} />}
        {question.QuestionType === "Date" && <TextField type="date" variant="outlined" size="small" value={currentAnswer} onChange={(e) => handleAnswerChange(questionKey, e.target.value)} InputLabelProps={{ shrink: true }} />}
        {question.QuestionType === "Dropdown" && (
            <FormControl fullWidth size="small">
                <InputLabel>Select an option</InputLabel>
                <Select value={currentAnswer} label="Select an option" onChange={(e) => handleAnswerChange(questionKey, e.target.value)}>
                    {question.Options?.map(option => <MenuItem key={option.key} value={option.key}>{option.text}</MenuItem>)}
                </Select>
            </FormControl>
        )}
        {question.QuestionType === "ImageCompare" && (
            <Box>
                <Typography variant="body2" gutterBottom>Choose an image</Typography>
                {[{ id: "left", label: "Image A", src: "https://picsum.photos/seed/a/400/250" }, { id: "right", label: "Image B", src: "https://picsum.photos/seed/b/400/250" }].map(opt => (
                    <Card key={opt.id} sx={{ mb: 2, border: currentAnswer === opt.id ? "3px solid #1976d2" : "1px solid #e0e0e0" }}>
                        <CardActionArea onClick={() => handleAnswerChange(questionKey, opt.id)}>
                            <CardMedia component="img" height="250" image={opt.src} alt={opt.label} />
                            <Box sx={{ p: 1, textAlign: "center" }}><Typography>{opt.label}</Typography></Box>
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
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>{surveyTitle || "Survey"}</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ mb: 3 }}>
              {groupedQuestions.length > 0 && groupedQuestions[currentGroupIndex] && (
                  <>
                    <Typography variant="h5" gutterBottom sx={{ color: "primary.main" }}>
                        {groupedQuestions[currentGroupIndex].groupName}
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    {groupedQuestions[currentGroupIndex].questions
                      .filter(q => isQuestionVisible(q))
                      .map((question, qIndex) => renderQuestion(question, qIndex))}
                  </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          {!loading && groupedQuestions.length > 0 && (
            <Button variant="contained" onClick={handleNext}>
              {isLastGroup ? "Submit Survey" : "Next"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default CustomField;