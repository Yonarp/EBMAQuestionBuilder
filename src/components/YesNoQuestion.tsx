import React, { useEffect } from "react";
import { 
    FormControl,
    RadioGroup,
    FormControlLabel,
    Radio
} from "@mui/material";

export default function YesNoQuestion({ currentAnswer, handleAnswerChange, questionKey, question }) {
    useEffect(() => {
        console.log("===== LOGGING QUESTION FROM YESNO =====");
        console.log(question);
    }, []);

    if (question.Options && question.Options.length > 0) {
        return (
            <FormControl component="fieldset">
                <RadioGroup
                    value={currentAnswer}
                    onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
                    row
                >
                    {/* <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                    <FormControlLabel value="no" control={<Radio />} label="No" /> */}
                    {question.Options?.map((option: any) => (
                        <FormControlLabel 
                            value={option.key}
                            control={<Radio />}
                            label={<div dangerouslySetInnerHTML={{ __html: option.text }} />}
                        />
                    ))}
                </RadioGroup>
            </FormControl>
        )
    }

    return (
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
    )
}