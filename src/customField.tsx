// @ts-nocheck
import { ThemeProvider } from "@mui/system";
import React, { useState, useEffect } from "react";
import { Button, Dialog, DialogTitle, FiveInitialize } from "./FivePluginApi";
import { CustomFieldProps } from "../../../common";
import {
  DialogContent,
  DialogActions,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
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
  Rating,
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

// Interface for the question data from your API
interface ApiQuestion {
  GroupName: string;
  GroupOrder: string;
  Question: string;
  QuestionGroupKey: string;
  QuestionKey: string;
  QuestionOrder: string;
  QuestionType: string;
  QuestionaireKey: string;
  QuestionaireName: string;
  AnchorLeft?: string;
  AnchorRight?: string;
  MinRange?: number;
  MaxRange?: number;
  // For MCQ and MultiSelect options
  Answer?: string;
  AnswerKey?: string;
  AnswerOrder?: string;
  // Matrix specific properties
  MatrixRows?: string[]; // Array of row labels
  MatrixColumns?: string[]; // Array of column labels
  MatrixType?: "single" | "multiple"; // Single select or multiple select per row
}

// Interface for processed question with options
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
  SliderMinRange?: number;
  SliderMaxRange?: number;
  AnchorLeft?: string;
  AnchorRight?: string;
  Options?: { key: string; text: string; order: number }[]; // For MCQ and MultiSelect
  MatrixRows?: string[];
  MatrixColumns?: string[];
  MatrixType?: "single" | "multiple";
}

// Interface for grouped questions
interface QuestionGroup {
  groupName: string;
  groupOrder: number;
  questions: ProcessedQuestion[];
}

// New component to manage slider state locally
const SliderQuestion = ({ question, initialValue, onCommitAnswer }) => {
  // Determine the default value if none is provided
  const defaultValue = question.SliderMinRange ?? 1;

  // Set the local state for the slider. It's initialized from the parent's state.
  const [sliderValue, setSliderValue] = useState(
    typeof initialValue === "number" ? initialValue : defaultValue
  );

  // Syncs the local state if the initial value from the parent changes
  useEffect(() => {
    const newInitialValue =
      typeof initialValue === "number" ? initialValue : defaultValue;
    setSliderValue(newInitialValue);
  }, [initialValue, defaultValue]);

  // This updates the local state while the user is dragging the slider
  const handleSliderChange = (event, newValue) => {
    setSliderValue(newValue);
  };

  // This updates the PARENT state only when the user lets go of the slider
  const handleSliderCommit = (event, finalValue) => {
    onCommitAnswer(finalValue);
  };

  return (
    <Box sx={{ px: 2 }}>
      <Typography variant="body2" gutterBottom>
        Rate from {question.SliderMinRange || 1} to{" "}
        {question.SliderMaxRange || 10}
      </Typography>

      <Slider
        value={sliderValue} // Value is now from the local state
        onChange={handleSliderChange} // Updates local state on move
        onChangeCommitted={handleSliderCommit} // Updates parent state on release
        step={1}
        min={question.SliderMinRange || 1}
        max={question.SliderMaxRange || 10}
        valueLabelDisplay="auto"
        marks={[
          {
            value: question.SliderMinRange || 1,
            label:
              question.AnchorLeft ||
              (question.SliderMinRange || 1).toString(),
          },
          {
            value: question.SliderMaxRange || 10,
            label:
              question.AnchorRight ||
              (question.SliderMaxRange || 10).toString(),
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

const CustomField = (props: CustomFieldProps) => {
  const { theme, five } = props;
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [questionData, setQuestionData] = useState<ProcessedQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [surveyTitle, setSurveyTitle] = useState<string>("");

  // Store user answers
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const handleDialogOpen = async () => {
    setDialogOpen(true);
    setLoading(true);

    const questionnaireKey =
      five.form.Questionaires["Questionaire.QuestionaireKey"];
    const questionObj = {
      Key: questionnaireKey,
    };

    await five.executeFunction(
      "Q100GetQuestionData",
      questionObj,
      null,
      null,
      null,
      (result) => {
        const data = JSON.parse(result.serverResponse.results);
        const rawQuestions: ApiQuestion[] = data.records;
        console.log("Showing Data", data);

        // Process questions to group options for MCQ and MultiSelect
        const processedQuestions = processQuestionsWithOptions(rawQuestions);
        setQuestionData(processedQuestions);

        // Set survey title from first record
        if (rawQuestions.length > 0) {
          setSurveyTitle(rawQuestions[0].QuestionaireName);
        }

        setLoading(false);
      }
    );
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setAnswers({}); // Clear answers when closing
  };

  // Process raw API data to group options for MCQ and MultiSelect questions
  const processQuestionsWithOptions = (
    rawQuestions: ApiQuestion[]
  ): ProcessedQuestion[] => {
    const questionMap = new Map<string, ProcessedQuestion>();

    rawQuestions.forEach((item) => {
      const questionKey =
        item.QuestionKey || `${item.QuestionGroupKey}-${item.QuestionOrder}`;

      if (!questionMap.has(questionKey)) {
        // Create the base question
        questionMap.set(questionKey, {
          GroupName: item.GroupName,
          GroupOrder: item.GroupOrder,
          Question: item.Question,
          QuestionGroupKey: item.QuestionGroupKey,
          QuestionKey: questionKey,
          QuestionOrder: item.QuestionOrder,
          QuestionType: item.QuestionType,
          QuestionaireKey: item.QuestionaireKey,
          QuestionaireName: item.QuestionaireName,
          SliderMinRange: item.MinRange,
          SliderMaxRange: item.MaxRange,
          AnchorLeft: item.AnchorLeft,
          AnchorRight: item.AnchorRight,
          MatrixRows: item.MatrixRows,
          MatrixColumns: item.MatrixColumns,
          MatrixType: item.MatrixType,
          Options: [],
        });
      }

      // If this item has an Answer (option), add it to the question's options
      if (item.Answer && item.Answer.trim() !== "") {
        const question = questionMap.get(questionKey)!;
        if (!question.Options) question.Options = [];

        question.Options.push({
          key: item.AnswerKey || `option-${question.Options.length}`,
          text: item.Answer,
          order: parseInt(item.AnswerOrder || "0"),
        });
      }
    });

    // Sort options by order for each question
    questionMap.forEach((question) => {
      if (question.Options) {
        question.Options.sort((a, b) => a.order - b.order);
      }
    });

    return Array.from(questionMap.values());
  };
  const handleAnswerChange = (questionKey: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: value,
    }));
  };

  // Handle matrix answer changes
  const handleMatrixChange = (
    questionKey: string,
    rowIndex: number,
    columnIndex: number,
    matrixType: "single" | "multiple" = "single"
  ) => {
    setAnswers((prev) => {
      const currentMatrix = prev[questionKey] || {};

      if (matrixType === "multiple") {
        // For multiple select, toggle the checkbox
        const currentRow = currentMatrix[rowIndex] || [];
        const updatedRow = currentRow.includes(columnIndex)
          ? currentRow.filter((col: number) => col !== columnIndex)
          : [...currentRow, columnIndex];

        return {
          ...prev,
          [questionKey]: {
            ...currentMatrix,
            [rowIndex]: updatedRow,
          },
        };
      } else {
        // For single select, set the column index
        return {
          ...prev,
          [questionKey]: {
            ...currentMatrix,
            [rowIndex]: columnIndex,
          },
        };
      }
    });
  };

  // Handle checkbox changes (for multiple selections)
  const handleCheckboxChange = (questionKey: string, optionKey: string) => {
    setAnswers((prev) => {
      const currentAnswers = prev[questionKey] || [];
      const updatedAnswers = currentAnswers.includes(optionKey)
        ? currentAnswers.filter((item: string) => item !== optionKey)
        : [...currentAnswers, optionKey];

      return {
        ...prev,
        [questionKey]: updatedAnswers,
      };
    });
  };

  // Group questions by GroupName and sort by order
  const groupedQuestions = React.useMemo(() => {
    const groups: Record<string, QuestionGroup> = {};

    questionData.forEach((question) => {
      if (!groups[question.GroupName]) {
        groups[question.GroupName] = {
          groupName: question.GroupName,
          groupOrder: parseInt(question.GroupOrder),
          questions: [],
        };
      }
      groups[question.GroupName].questions.push(question);
    });

    // Sort questions within each group by QuestionOrder
    Object.values(groups).forEach((group) => {
      group.questions.sort(
        (a, b) => parseInt(a.QuestionOrder) - parseInt(b.QuestionOrder)
      );
    });

    // Return groups sorted by GroupOrder
    return Object.values(groups).sort((a, b) => a.groupOrder - b.groupOrder);
  }, [questionData]);

  // Render individual question based on type
  const renderQuestion = (question: ProcessedQuestion, index: number) => {
    
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

        {/* Text Input */}
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

        {/* Long Text / Textarea */}
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

        {/* Multiple Choice Questions (MCQ) */}
        {question.QuestionType === "MCQ" && (
          <FormControl component="fieldset">
            <FormLabel component="legend">Select one option:</FormLabel>
            <RadioGroup
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
            >
              {question.Options && question.Options.length > 0 ? (
                question.Options.map((option) => (
                  <FormControlLabel
                    key={option.key}
                    value={option.key}
                    control={<Radio />}
                    label={option.text}
                  />
                ))
              ) : (
                // Fallback if no options are provided
                <>
                  <FormControlLabel
                    value="option1"
                    control={<Radio />}
                    label="Option 1"
                  />
                  <FormControlLabel
                    value="option2"
                    control={<Radio />}
                    label="Option 2"
                  />
                  <FormControlLabel
                    value="option3"
                    control={<Radio />}
                    label="Option 3"
                  />
                </>
              )}
            </RadioGroup>
          </FormControl>
        )}

        {/* Multiple Select / Checkbox */}
        {question.QuestionType === "MultiSelect" && (
          <FormControl component="fieldset">
            <FormLabel component="legend">Select all that apply:</FormLabel>
            <Box sx={{ mt: 1 }}>
              {question.Options && question.Options.length > 0
                ? question.Options.map((option) => (
                    <FormControlLabel
                      key={option.key}
                      control={
                        <Checkbox
                          checked={(answers[questionKey] || []).includes(
                            option.key
                          )}
                          onChange={() =>
                            handleCheckboxChange(questionKey, option.key)
                          }
                        />
                      }
                      label={option.text}
                    />
                  ))
                : // Fallback if no options are provided
                  ["Option 1", "Option 2", "Option 3"].map((option, idx) => (
                    <FormControlLabel
                      key={`fallback-${idx}`}
                      control={
                        <Checkbox
                          checked={(answers[questionKey] || []).includes(
                            `fallback-${idx}`
                          )}
                          onChange={() =>
                            handleCheckboxChange(questionKey, `fallback-${idx}`)
                          }
                        />
                      }
                      label={option}
                    />
                  ))}
            </Box>
          </FormControl>
        )}

        {/* Matrix Question */}
        {question.QuestionType === "Matrix" && (
          <Box>
            <Typography variant="body2" gutterBottom color="text.secondary">
              {question.MatrixType === "multiple"
                ? "Select all that apply for each row:"
                : "Select one option for each row:"}
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold", bgcolor: "grey.50" }}>
                      {/* Empty cell for row headers */}
                    </TableCell>
                    {(
                      question.MatrixColumns || [
                        "Strongly Disagree",
                        "Disagree",
                        "Neutral",
                        "Agree",
                        "Strongly Agree",
                      ]
                    ).map((column, colIndex) => (
                      <TableCell
                        key={colIndex}
                        align="center"
                        sx={{
                          fontWeight: "bold",
                          bgcolor: "grey.50",
                          minWidth: "120px",
                        }}
                      >
                        {column}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(
                    question.MatrixRows || [
                      "The product is easy to use",
                      "The product meets my needs",
                      "I would recommend this product",
                      "The product is good value for money",
                    ]
                  ).map((row, rowIndex) => (
                    <TableRow key={rowIndex} hover>
                      <TableCell
                        sx={{ fontWeight: "medium", bgcolor: "grey.25" }}
                      >
                        {row}
                      </TableCell>
                      {(
                        question.MatrixColumns || [
                          "Strongly Disagree",
                          "Disagree",
                          "Neutral",
                          "Agree",
                          "Strongly Agree",
                        ]
                      ).map((_, colIndex) => (
                        <TableCell key={colIndex} align="center">
                          {question.MatrixType === "multiple" ? (
                            <Checkbox
                              checked={(
                                (answers[questionKey] || {})[rowIndex] || []
                              ).includes(colIndex)}
                              onChange={() =>
                                handleMatrixChange(
                                  questionKey,
                                  rowIndex,
                                  colIndex,
                                  "multiple"
                                )
                              }
                              color="primary"
                            />
                          ) : (
                            <Radio
                              checked={
                                (answers[questionKey] || {})[rowIndex] ===
                                colIndex
                              }
                              onChange={() =>
                                handleMatrixChange(
                                  questionKey,
                                  rowIndex,
                                  colIndex,
                                  "single"
                                )
                              }
                              color="primary"
                              name={`matrix-${questionKey}-row-${rowIndex}`}
                            />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Show current selections for debugging */}
            {Object.keys(answers[questionKey] || {}).length > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Current selections: {JSON.stringify(answers[questionKey])}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* ------------ Rating Scale (now uses the new component) ----------- */}
        {question.QuestionType === "Rating" && (
          <SliderQuestion
            question={question}
            initialValue={answers[questionKey]}
            onCommitAnswer={(newValue) =>
              handleAnswerChange(questionKey, newValue)
            }
          />
        )}

        {/* Yes/No */}
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

        {/* Number Input */}
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

        {/* Email Input */}
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

        {/* Date Input */}
        {question.QuestionType === "Date" && (
          <TextField
            type="date"
            variant="outlined"
            size="small"
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
        )}

        {/* Dropdown */}
        {question.QuestionType === "Dropdown" && (
          <FormControl fullWidth size="small">
            <InputLabel>Select an option</InputLabel>
            <Select
              value={currentAnswer}
              label="Select an option"
              onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
            >
              <MenuItem value="option1">Option 1</MenuItem>
              <MenuItem value="option2">Option 2</MenuItem>
              <MenuItem value="option3">Option 3</MenuItem>
            </Select>
          </FormControl>
        )}

        {/* Image Comparison */}
        {question.QuestionType === "ImageCompare" && (
          <Box>
            <Typography variant="body2" gutterBottom>
              Choose the image you prefer
            </Typography>

            {/* dummy image data – replace with real URLs later */}
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
                  borderRadius: 2,
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
                    <Typography variant="subtitle1">{opt.label}</Typography>
                  </Box>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        )}
      </Paper>
    );
  };

  // Handle form submission
  const handleSubmit = () => {
    console.log("Survey Answers:", answers);
    alert("Survey submitted! Check console for answers.");
    // Here you would typically send the answers to your backend
    handleDialogClose();
  };

  return (
    <ThemeProvider theme={theme}>
      <Button onClick={handleDialogOpen}>View Survey</Button>

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{surveyTitle || "Survey"}</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading questions...</Typography>
            </Box>
          ) : questionData.length === 0 ? (
            <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary" variant="h6">
                No questions found
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                This survey doesn't have any questions yet.
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ mb: 3 }}>
              {groupedQuestions.map((group, groupIndex) => (
                <Box key={group.groupName} sx={{ mb: 4 }}>
                  {/* Group Header */}
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ color: "primary.main" }}
                  >
                    {group.groupName}
                  </Typography>
                  <Divider sx={{ mb: 3 }} />

                  {/* Questions in this group */}
                  {group.questions.map((question, questionIndex) =>
                    renderQuestion(question, questionIndex)
                  )}
                </Box>
              ))}

              {/* Submit Button */}
              <Paper
                elevation={1}
                sx={{ p: 3, textAlign: "center", mt: 3, bgcolor: "grey.50" }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                >
                  Submit Survey
                </Button>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Total Questions: {questionData.length}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default CustomField;