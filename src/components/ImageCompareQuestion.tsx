import React from "react";
import { 
    Box,
    Typography,
    Card,
    CardActionArea,
    CardMedia
} from "@mui/material";

export default function ImageCompareQuestion({ currentAnswer, handleAnswerChange, questionKey }) {

    return (
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
    )
}