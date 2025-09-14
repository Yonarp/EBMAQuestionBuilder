import React from "react";
import { 
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from "@mui/material";

export default function DropdownQuestion({ currentAnswer, handleAnswerChange, questionKey, question }) {
    return (
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
    )
}