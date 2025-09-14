import React from "react";
import {
    Box,
    Typography,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Radio,
    Paper,
    Slider,
    Checkbox
} from "@mui/material";

export default function MatrixQuestion({ question, answers, questionKey, handleNumericalMatrixChange, handleMatrixChange }) {
    const minValue = Number(question.MinRange ?? 1);
    const maxValue = Number(question.MaxRange ?? 10);
    const showSliderValue = Boolean(parseInt(question.ShowSliderValue));

    return (
        <Box>
            <Typography variant="body2" gutterBottom color="text.secondary">
                {question.MatrixType === "multiple"
                    ? "Select all that apply for each row:"
                    : question.MatrixType === "numerical"
                        ? "Move the slider to indicate the level for each item:"
                        : "Select one option for each row:"}
            </Typography>
            {question.MatrixRows?.length > 0 &&
                (question.MatrixColumns?.length > 0 ||
                    question.MatrixType === "numerical") ? (
                <>
                    {question.MatrixType === "numerical" ? (
                        // --- NEW: Numerical (Slider) Matrix Rendering ---
                        <TableContainer
                            component={Paper}
                            variant="outlined"
                            sx={{ mt: 2 }}
                        >
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell
                                            sx={{ width: "30%", borderBottom: "none" }}
                                        />
                                        <TableCell sx={{ borderBottom: "none", px: 2 }}>
                                            <div style={{ display: "flex", alignItems: 'center' }}>
                                                <Box sx={{ textAlign: "left", flex: 1 }}>
                                                    {question.LeftAnchor && (
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            sx={{ fontWeight: "medium", display: "block" }}
                                                        >
                                                            {question.LeftAnchor}
                                                        </Typography>
                                                    )}
                                                    {showSliderValue ?
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        {question.MinRangeText || question.MinRange}
                                                    </Typography>
                                                    : null }
                                                </Box>

                                                <Box sx={{ textAlign: "right", flex: 1 }}>
                                                    {question.RightAnchor && (
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            sx={{ fontWeight: "medium", display: "block" }}
                                                        >
                                                            {question.RightAnchor}
                                                        </Typography>
                                                    )}
                                                    {showSliderValue ? 
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        {question.MaxRangeText || question.MaxRange}
                                                    </Typography>
                                                    : null}
                                                </Box>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {question.MatrixRows.map((row: any, rIdx: any) => {
                                        const currentValue = (answers[questionKey] || {})[rIdx] ?? minValue;

                                        return (
                                            <TableRow key={row.key} hover>
                                                <TableCell
                                                    sx={{ fontWeight: "medium", width: "30%" }}
                                                >
                                                    <div dangerouslySetInnerHTML={{ __html: row.text }} />
                                                </TableCell>
                                                <TableCell sx={{ px: 2 }}>
                                                    <Slider
                                                        key={`${questionKey}-${rIdx}`} 
                                                        value={currentValue}
                                                        min={minValue}
                                                        max={maxValue}
                                                        step={1}
                                                        onChange={(_: any, val: any) => {
                                                            handleNumericalMatrixChange(questionKey, rIdx, val);
                                                        }}
                                                        valueLabelDisplay={showSliderValue ? "auto" : "off"}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        // --- EXISTING: Radio/Checkbox Matrix Rendering ---
                        <TableContainer
                            component={Paper}
                            variant="outlined"
                            sx={{ mt: 2 }}
                        >
                            <Table size="small">
                                <TableHead>
                                    {(question.LeftAnchor || question.RightAnchor) && (
                                        <TableRow>
                                            <TableCell sx={{ borderBottom: "none" }} />
                                            {question.MatrixColumns.map((col, cIdx) => (
                                                <TableCell
                                                    key={`anchor-${col.key}`}
                                                    align="center"
                                                    sx={{ borderBottom: "none", pb: 0 }}
                                                >
                                                    {cIdx === 0 && question.LeftAnchor && (
                                                        <div style={{ width: "100%", textAlign: 'left' }}>
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                sx={{ fontWeight: "medium" }}
                                                            >
                                                                {question.LeftAnchor}
                                                            </Typography>
                                                        </div>
                                                    )}
                                                    {cIdx === question.MatrixColumns.length - 1 && question.RightAnchor && (
                                                        <div style={{ width: "100%", textAlign: 'right' }}>
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                sx={{ fontWeight: "medium" }}
                                                            >
                                                                {question.RightAnchor}
                                                            </Typography>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    )}
                                    <TableRow>
                                        <TableCell
                                            sx={{ fontWeight: "bold", bgcolor: "grey.50" }}
                                        />
                                        {question.MatrixColumns.map((col: any) => (
                                            <TableCell
                                                key={col.key}
                                                align="center"
                                                sx={{
                                                    fontWeight: "bold",
                                                    bgcolor: col.isExclusive
                                                        ? "orange.50"
                                                        : "grey.50",
                                                    borderLeft: col.isExclusive
                                                        ? "3px solid orange"
                                                        : "none",
                                                }}
                                            >
                                                {/* {col.text} */}
                                                <div dangerouslySetInnerHTML={{ __html: col.text }} />
                                                {col.isExclusive && (
                                                    <Typography
                                                        variant="caption"
                                                        display="block"
                                                        color="orange.main"
                                                    >
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
                                            <TableCell sx={{ fontWeight: "medium" }}>
                                                <div dangerouslySetInnerHTML={{ __html: row.text }} />
                                            </TableCell>
                                            {question.MatrixColumns.map((col, cIdx) => (
                                                <TableCell
                                                    key={col.key}
                                                    align="center"
                                                    sx={{
                                                        bgcolor: col.isExclusive
                                                            ? "orange.25"
                                                            : "inherit",
                                                    }}
                                                >
                                                    {question.MatrixType === "multiple" ? (
                                                        <Checkbox
                                                            checked={(
                                                                (answers[questionKey] || {})[rIdx] || []
                                                            ).includes(cIdx)}
                                                            onChange={() =>
                                                                handleMatrixChange(
                                                                    questionKey,
                                                                    rIdx,
                                                                    cIdx,
                                                                    "multiple"
                                                                )
                                                            }
                                                            sx={{
                                                                color: col.isExclusive
                                                                    ? "orange.main"
                                                                    : "inherit",
                                                                "&.Mui-checked": {
                                                                    color: col.isExclusive
                                                                        ? "orange.main"
                                                                        : "primary.main",
                                                                },
                                                            }}
                                                        />
                                                    ) : (
                                                        <Radio
                                                            checked={
                                                                (answers[questionKey] || {})[rIdx] ===
                                                                cIdx
                                                            }
                                                            onChange={() =>
                                                                handleMatrixChange(
                                                                    questionKey,
                                                                    rIdx,
                                                                    cIdx,
                                                                    "single"
                                                                )
                                                            }
                                                            name={`matrix-${questionKey}-row-${rIdx}`}
                                                            sx={{
                                                                color: col.isExclusive
                                                                    ? "orange.main"
                                                                    : "inherit",
                                                                "&.Mui-checked": {
                                                                    color: col.isExclusive
                                                                        ? "orange.main"
                                                                        : "primary.main",
                                                                },
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
                    )}
                </>
            ) : (
                <Typography color="warning.main" variant="body2">
                    Matrix question is missing rows or columns. Please check your
                    data. <br />
                    Debug: Rows: {question.MatrixRows?.length || 0}, Columns:
                    {question.MatrixColumns?.length || 0}
                </Typography>
            )}
        </Box>
    )
}