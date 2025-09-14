import React from "react";
import { TextField } from "@mui/material";


export default function RegExQuestion({ currentAnswer, questionKey, question, handleRegExChange, errors }) {
    return (
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
    )
}