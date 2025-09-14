import React from "react";
import {
    FormLabel,
    FormControl,
    RadioGroup,
    FormControlLabel,
    TextField,
    Radio,
} from "@mui/material";

export default function McqQuestion({ currentAnswer, handleMCQChange, question, questionKey, handleMCQOtherTextChange }) {
    const isOtherSelected = typeof currentAnswer === "object" && currentAnswer.selected === "other";
    const radioGroupValue = isOtherSelected ? "other" : currentAnswer;
    const isHorizontal = question.Orientation?.toLowerCase() === "horizontal";

    return (
        <FormControl component="fieldset" sx={{ width: "100%" }}>
            <FormLabel component="legend">Select one option:</FormLabel>
            <RadioGroup
                value={radioGroupValue}
                onChange={(e) => handleMCQChange(questionKey, e.target.value)}
                sx={{
                    ...(isHorizontal && {
                        display: "flex",
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 1,
                        mt: 1
                    })
                }}
            >
                {question.Options?.map((option) => (
                    <FormControlLabel
                        key={option.key}
                        value={option.key}
                        control={<Radio />}
                        label={<div dangerouslySetInnerHTML={{ __html: option.text }} />}
                        sx={isHorizontal ? {
                            minWidth: "fit-content",
                            marginRight: 2,
                            marginBottom: 0
                        } : {}}
                    />
                ))}
                {question.MCQOther === "1" && (
                    <FormControlLabel
                        key="other"
                        value="other"
                        control={<Radio />}
                        label="Other"
                        sx={isHorizontal ? {
                            minWidth: "fit-content",
                            marginRight: 2,
                            marginBottom: 0
                        } : {}}
                    />
                )}
            </RadioGroup>
            {question.MCQOther === "1" && isOtherSelected && (
                <TextField
                    fullWidth
                    placeholder="Please specify"
                    variant="outlined"
                    size="small"
                    value={isOtherSelected ? currentAnswer.value : ""}
                    onChange={(e) =>
                        handleMCQOtherTextChange(questionKey, e.target.value)
                    }
                    sx={{ mt: 1, ml: isHorizontal ? 0 : 4 }} // Remove left margin for horizontal layout
                />
            )}
        </FormControl>
    )
}