import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Tooltip
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

interface TableWidgetProps {
  data: any[];
}

const formatList = (data: any): string => {
  try {
    if (typeof data === "string") {
      data = JSON.parse(data);
    }

    if (!Array.isArray(data)) return "Invalid format";

    return data
      .map((group) =>
        Array.isArray(group) && group.length > 0
          ? group.join(", ")
          : "No Data,"
      )
      .join("\n");
  } catch (error) {
    return "Invalid format";
  }
};

const StyledTableCell = styled(TableCell)(() => ({
  padding: "12px",
  fontSize: "14px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "200px",
  textAlign: "center",
  verticalAlign: "middle",
  wordWrap: "break-word",
  fontFamily: "Arial, sans-serif",
}));

const StyledTableRow = styled(TableRow)(() => ({
  height: "50px",
  "&:nth-of-type(odd)": {
    backgroundColor: "#f9f9f9",
  },
}));

export const TableWidget: React.FC<TableWidgetProps> = ({ data }) => {

  const headers = [
    "ad_account_id",
    "ad_account_status",
    "access_token",
    "access_token_status",
    "page_name",
    "facebook_page_id",
    "facebook_page_status",
    "sku",
    "material_code",
    "interests_list",
    "daily_budget",
    "video_url",
    "headline",
    "primary_text",
    "image_url",
    "product",
    "start_date (YYYY-MM-DD)",
    "start_time (HH-MM-SS)",
    "excluded_ph_region",
    "status",
  ];

  if (data.length > 0) {
    console.log("🔑 TableWidget Column Names:", Object.keys(data[0])); // Ensure "status" exists
  }

  return (
    <Card className="shadow-lg">
      <CardContent>
        <TableContainer
          component={Paper}
          style={{ minHeight: "500px", maxHeight: "700px" }}
          className="overflow-auto"
        >
          <Table stickyHeader>
            {/* Table Header */}
            <TableHead>
              <StyledTableRow>
                {headers.map((header, index) => (
                  <StyledTableCell key={index} style={{ fontWeight: "bold" }}>
                    {header}
                  </StyledTableCell>
                ))}
              </StyledTableRow>
            </TableHead>

            <TableBody>
              {data.length === 0 ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={headers.length} align="center">
                    No data available
                  </StyledTableCell>
                </StyledTableRow>
              ) : (
                data.map((row: any, rowIndex: number) => {
                  const allVerified =
                    row["ad_account_status"] === "Verified" &&
                    row["access_token_status"] === "Verified" &&
                    row["facebook_page_status"] === "Verified";

                  return (
                    <StyledTableRow key={rowIndex}>
                      {headers.map((key, cellIndex) => (
                        <StyledTableCell key={cellIndex}>
                          {key === "ad_account_status" ||
                          key === "access_token_status" ||
                          key === "facebook_page_status" ? (
                            row[key] === "Verified" ? (
                              <CheckIcon color="success" />
                            ) : (
                              <Tooltip title={row[key]} arrow placement="top">
                                <span style={{ color: "red", fontWeight: "bold" }}>{row[key]}</span>
                              </Tooltip>
                            )
                          ) : key === "status" ? (
                            allVerified ? (
                              <CheckIcon color="success" />
                            ) : (
                              <Tooltip
                                title={`Ad Account: ${row.ad_account_status}\nAccess Token: ${row.access_token_status}\nFacebook Page: ${row.facebook_page_status}`}
                                arrow
                                placement="top"
                              >
                                <span style={{ color: "red", fontWeight: "bold" }}>Error</span>
                              </Tooltip>
                            )
                          ) : (
                            <Tooltip title={row[key] ?? ""} arrow placement="top">
                              <span>{key === "interests_list" ? formatList(row[key]) : row[key] ?? ""}</span>
                            </Tooltip>
                          )}
                        </StyledTableCell>
                      ))}
                    </StyledTableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
