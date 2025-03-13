import React, { useEffect, useState, useRef } from "react";
import Papa from "papaparse";
import { Button } from "@mui/material";
import { TableWidget } from "./widgets/TableWidget";
import Logo from "./assets/icon.png"; // Import TableWidget from another file
import CheckIcon from "@mui/icons-material/Check";

const App = () => {
  const [data, setData] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const isRunningRef = useRef(false);
  
  useEffect(() => {
  
    setIsVerified(
      data.length > 0 &&
      data.every(row => {
        console.log("🔍 Row Data:", row);
        const allVerified =
          row["ad_account_status"] === "Verified" &&
          row["access_token_status"] === "Verified" &&
          row["facebook_page_status"] === "Verified";
          
        console.log("📌 Status Value:", allVerified ? "OK" : "Error");
        return allVerified; // ✅ Check using TableWidget logic
      })
    );
  }, [data]);
  

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
  
    reader.onload = (e) => {
      const fileContent = e.target?.result as string;
  
      Papa.parse(fileContent, {
        complete: async (result) => {
          console.log("Parsed CSV Data:", result.data);
          const csvData = result.data as string[][];
  
          if (csvData.length > 1) {
            const headers = csvData[0].map((header) => header.trim());
            const formattedData = csvData.slice(1).map((row) =>
              headers.reduce((acc: any, header: string, index: number) => {
                acc[header] = row[index]?.trim() || "";
  
                if (header === "interest_list") {
                  acc[header] = parseInterestsList(acc[header]);
                } else if (header === "excluded_ph_region") {
                  acc[header] = parseExcludedPHRegion(acc[header]);
                }
  
                return acc;
              }, {})
            );
  
            setData(formattedData);
            console.log(`formatteddata: ${JSON.stringify(formattedData)}`);
            verifyAdAccounts(formattedData);

          }
        },
        header: false,
        skipEmptyLines: true,
      });
    };
  
    reader.readAsText(file, "UTF-8");
  };

  const compareCsvWithJson = (csvData: any[], jsonData: any[], setData: React.Dispatch<React.SetStateAction<any[]>>) => {  
    console.log("Comparing CSV data with JSON response...");
  
    const updatedData = csvData.map((csvRow) => {
      const jsonRow = jsonData.find(
        (json) =>
          json.ad_account_id === csvRow.ad_account_id &&
          json.facebook_page_id === csvRow.facebook_page_id
      );
  
      if (!jsonRow) {
        console.warn(`❌ No matching JSON entry for ad_account_id ${csvRow.ad_account_id} and facebook_page_id ${csvRow.facebook_page_id}`);
        return { 
          ...csvRow, 
          ad_account_status: "No matching account",
          access_token_status: "No matching token",
          facebook_page_status: "No matching page"
        };
      }
  
      return {
        ...csvRow,
        ad_account_status: jsonRow.ad_account_status === "Verified" ? "Verified" : jsonRow.ad_account_error || "Unknown Error",
        access_token_status: jsonRow.access_token_status === "Verified" ? "Verified" : jsonRow.access_token_error || "Unknown Error",
        facebook_page_status: jsonRow.facebook_page_status === "Verified" ? "Verified" : jsonRow.facebook_page_error || "Unknown Error"
      };
    });
  
    setData(updatedData);  // 🔹 Update table data with error messages
  };  
  
  const verifyAdAccounts = async (campaignsData: any[]) => {
    try {
      const response = await fetch("https://pgoccampaign.share.zrok.io/api/v1/verify-ads-account/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          skip_zrok_interstitial: "true",
        },
        body: JSON.stringify({ user_id: 1, campaigns: campaignsData }),
      });
  
      const result = await response.json();
      console.log(`RESULT: ${JSON.stringify(result)}`);
  
      if (response.ok && result.verified_accounts) {
        compareCsvWithJson(campaignsData, result.verified_accounts, setData); // 🔹 Now updates table data!
      } else {
        console.warn("⚠️ No verified accounts returned from API.");
      }
    } catch (error) {
      console.error("Error verifying ad accounts:", error);
    }
  };

  const parseInterestsList = (interestsString: string): string[][] => {
    if (!interestsString || interestsString.trim() === "") return [[]];

    console.log("Raw interests_list before processing:", interestsString);

    try {
      // Split by "/" and handle empty or space-only groups as "[]"
      const groups = interestsString.split("/").map((group) => {
        const trimmedGroup = group.trim();
        return trimmedGroup === "" ? "[]" : trimmedGroup;
      });

      // Process each group separately
      const parsedArray = groups.map((group) => {
        // If the group is exactly "[]", return an empty array
        if (group === "[]") return [];

        // Otherwise, split by commas and trim each interest
        return group.split(",").map((interest) => interest.trim());
      });

      console.log("Formatted interests_list:", parsedArray);
      return parsedArray;
    } catch (error) {
      console.error("Error parsing interests_list:", interestsString, error);
    }

    return [[]]; // Default to an empty nested array if parsing fails
  };

  // New function to parse the excluded_ph_region
  const parseExcludedPHRegion = (regionString: string): string[][] => {
    if (!regionString || regionString.trim() === "") return [[]];

    console.log("Raw excluded_ph_region before processing:", regionString);

    try {
      // Split by "/" and handle empty or space-only groups as "[]"
      const groups = regionString.split("/").map((group) => {
        const trimmedGroup = group.trim();
        return trimmedGroup === "" ? "[]" : trimmedGroup;
      });

      // Process each group separately
      const parsedArray = groups.map((group) => {
        // If the group is exactly "[]", return an empty array
        if (group === "[]") return [];

        // Otherwise, split by commas and trim each region
        return group.split(",").map((region) => region.trim());
      });

      console.log("Formatted excluded_ph_region:", parsedArray);
      return parsedArray;
    } catch (error) {
      console.error("Error parsing excluded_ph_region:", regionString, error);
    }

    return [[]]; // Default to an empty nested array if parsing fails
  };

  const handleRun = async () => {
    if (isRunningRef.current) return; // Prevent duplicate execution
    isRunningRef.current = true;
  
    // 🚀 Check if any row has errors before proceeding
    const errorRows = data
    .map((row, index) => {
      let errors = [];
      if (row["ad_account_status"] !== "Verified") errors.push(`Ad Account: ${row["ad_account_status"]}`);
      if (row["access_token_status"] !== "Verified") errors.push(`Access Token: ${row["access_token_status"]}`);
      if (row["facebook_page_status"] !== "Verified") errors.push(`Facebook Page: ${row["facebook_page_status"]}`);

      return errors.length > 0 ? `Row ${index + 1}: ${errors.join(", ")}` : null;
    })
    .filter(error => error !== null); // Remove null entries

  if (errorRows.length > 0) {
    setLogs(prevLogs => [
      ...prevLogs,
      "❌ Run blocked due to errors:",
      ...errorRows,
      "--------------------------------------------"
    ]);

    console.warn("❌ Execution blocked due to errors:", errorRows);

    isRunningRef.current = false; // Allow retrying after fixing errors
    return; // 🚫 Stop execution if there are errors
  }
  
    setIsRunning(true);
    setLogs((prevLogs) => [...prevLogs, "Running operation..."]);
  
    const validCampaigns = data.filter((row) =>
      Object.values(row).every((value) => value !== null && value !== "")
    );
  
    console.log("🔍 Total valid campaigns:", validCampaigns.length);
    console.log("✅ Valid campaigns:", JSON.stringify(validCampaigns, null, 2));
  
    if (validCampaigns.length === 0) {
      setLogs((prevLogs) => [
        ...prevLogs,
        "Error: No valid campaigns available after filtering null data.",
      ]);
      setIsRunning(false);
      isRunningRef.current = false;
      return;
    }
  
    for await (const [index, row] of validCampaigns.entries()) {
      console.log(`🔄 START Processing row ${index + 1}/${validCampaigns.length}:`, row);
  
      let parsedInterests = row["interests_list"];
      let parsedExcludedRegions = row["excluded_ph_region"];
  
      if (typeof parsedInterests === "string") {
        try {
          if (!parsedInterests.startsWith("[") || !parsedInterests.endsWith("]")) {
            parsedInterests = parsedInterests
              .split("/")
              .map(group => `[${group.trim().split(",").map(item => `"${item.trim()}"`).join(",")}]`)
              .join(",");
  
            parsedInterests = `[${parsedInterests}]`; // Wrap everything in an array
          }
  
          parsedInterests = JSON.parse(parsedInterests);
        } catch (error) {
          console.error("❌ Error parsing interests_list:", parsedInterests, error);
          parsedInterests = [[]]; // Default to an empty array if parsing fails
        }
      }
  
      const requestBody = {
        user_id: 1,
        campaigns: [
          {
            ad_account_id: row["ad_account_id"],
            access_token: row["access_token"],
            page_name: row["page_name"],
            sku: row["sku"],
            material_code: row["material_code"],
            daily_budget: parseInt(row["daily_budget"], 10) || 0,
            facebook_page_id: row["facebook_page_id"],
            video_url: row["video_url"],
            headline: row["headline"],
            primary_text: row["primary_text"],
            image_url: row["image_url"],
            product: row["product"],
            interests_list: parsedInterests,
            exclude_ph_region: parsedExcludedRegions,
            start_date: row["start_date (YYYY-MM-DD)"],
            start_time: row["start_time (HH-MM-SS)"],
          },
        ],
      };
  
      console.log(`📦 FINAL REQUEST BODY for row ${index + 1}:`, JSON.stringify(requestBody, null, 2));
      console.log(`🚀 Sending campaign request ${index + 1}:`, requestBody);
  
      try {
        const response = await fetch(
          "https://pgoccampaign.share.zrok.io/api/v1/campaign/create-campaigns",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              skip_zrok_interstitial: "true",
            },
            body: JSON.stringify(requestBody),
          }
        );
  
        const contentType = response.headers.get("Content-Type");
  
        if (!response.ok) {
          setLogs((prevLogs) => [
            ...prevLogs,
            `Error: Failed to create campaign for SKU ${row["sku"]} (Status: ${response.status})`,
          ]);
          console.log(`❌ Response Body: ${JSON.stringify(response)}`);
          continue;
        }
  
        if (contentType && contentType.includes("application/json")) {
          const responseBody = await response.json();
          setLogs((prevLogs) => [
            ...prevLogs,
            `✅ Response for SKU ${row["sku"]}: Status ${response.status}`,
          ]);
  
          if (responseBody.tasks && responseBody.tasks.length > 0) {
            console.log("📌 Response Body:", responseBody);
            setLogs((prevLogs) => [
              ...prevLogs,
              `Task Created: ${responseBody.tasks[0].campaign_name} - Status: ${
                responseBody.tasks[0].status
              } - Message: ${JSON.stringify(responseBody.tasks[0])}`,
            ]);
          } else {
            setLogs((prevLogs) => [
              ...prevLogs,
              `⚠️ No task information available for SKU ${row["sku"]}.`,
            ]);
          }
        } else {
          const textResponse = await response.text();
          setLogs((prevLogs) => [
            ...prevLogs,
            `Error: Expected JSON but received for SKU ${row["sku"]}: ${JSON.stringify(textResponse)}`,
          ]);
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          setLogs((prevLogs) => [
            ...prevLogs,
            `❌ Error for SKU ${row["sku"]}: ${error.message}`,
          ]);
        } else {
          setLogs((prevLogs) => [
            ...prevLogs,
            `❌ Unknown error occurred for SKU ${row["sku"]}`,
          ]);
        }
      }
  
      console.log(`✅ FINISHED Processing row ${index + 1}`);
    }
  
    setIsRunning(false);
    isRunningRef.current = false; // ✅ Ensure this is AFTER the loop
  
    // ✅ Add notice after all campaigns are processed
    setLogs((prevLogs) => [
      ...prevLogs,
      "-------------------------------------------------",
      "✅ All campaigns have been created successfully!",
      "-------------------------------------------------"
    ]);
  };  

  const handleDownloadTemplate = () => {
    const template = [
      [
        "ad_account_id",
        "access_token",
        "page_name",
        "sku",
        "material_code",
        "interests_list", // Moved after material_code
        "daily_budget",
        "facebook_page_id",
        "video_url",
        "headline",
        "primary_text",
        "image_url",
        "product",
        "start_date (YYYY-MM-DD)",
        "start_time (HH-MM-SS)",
        "excluded_ph_region",
      ],
      [
        "'",
        "'",
        "'",
        "'",
        "'",
        `"[] / Interest1, Interest2, Interest3 / Interest4, Interest5, Interest6"`, // Changed to use "/"
        "'",
        "'",
        "'",
        "'",
        "'",
        "'",
        "'",
        "YYYY-MM-DD",
        "HH-MM-SS",
        `"Zamboanga Peninsula,Northern Mindanao,Davao Region,Soccsksargen,Caraga,Autonomous Region in Muslim Mindanao"`,
      ],
    ];

    const csvContent = template.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=UTF-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "campaign_creation_template.csv";
    link.click();
  };

  // Function to fetch regions and download them as CSV
  const handleDownloadRegions = async () => {
    try {
      const response = await fetch(
        "http://pgoccampaign.share.zrok.io/regions",
        {
          method: "GET", // Use GET or specify the appropriate method
          headers: {
            "Content-Type": "application/json",
            skip_zrok_interstitial: "true", // Custom header
          },
        }
      );

      const regionsData = await response.json();

      // Create CSV content with region_name, key, and country
      const csvRows = [
        ["id", "region_name", "key", "country"], // Header
        ...regionsData.map((region: any) => [
          region.id,
          region.region_name,
          region.region_key,
          region.country_code,
        ]), // Region data
      ];
      const csvContent = csvRows.map((row) => row.join(",")).join("\n");

      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: "text/csv;charset=UTF-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "ph_regions.csv";
      link.click();
    } catch (error) {
      console.error("Error fetching regions:", error);
    }
  };

  return (
        <div className="container mx-auto p-6">
        <div className="flex justify-center mb-4">
          <img src={Logo} alt="PGOC Logo" className="h-16 w-auto" />
        </div>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">
            PGOC CAMPAIGN CREATION TESTING v1.6
          </h1>
        </div>

        <div className="mt-8 text-gray-700">
          <h2 className="text-xl font-bold">
            Instructions for Using CSV Template
          </h2>
          <ul className="list-disc list-inside">
            <li>
              Download the template by clicking the <b>"Download Template"</b>{" "}
              button.
            </li>
            <li>
              Ensure that all values in the CSV start with an apostrophe (<b>'</b>
              ) to prevent Excel from auto-formatting.
            </li>
            <li>
              Save the CSV file as <b>UTF-8 encoding</b>:
              <ul className="ml-6 list-decimal list-inside">
                <li>
                  In Excel, go to <b>File {">"} Save As</b> and select{" "}
                  <b>CSV UTF-8 (Comma delimited) (.csv)</b>.
                </li>
                <li>
                  In Google Sheets, go to{" "}
                  <b>
                    File {">"} Download {">"} Comma-separated values (.csv)
                  </b>
                  .
                </li>
              </ul>
            </li>
            <li>
              Import the filled CSV file using the <b>"Import CSV"</b> button
              before running the operation.
            </li>
            <li>
              Ensure the `interests_list` and `exclude_ph_region` column follows
              this format: Use `/` as a delimiter between interest groups -
              Example values: -{" "}
              <b>
                `[] / Interest1, Interest2, Interest3 / Interest4, Interest5 `
              </b>
              <li>
                {" "}
                <b>AND `[] / Davao, Mimaropa, Calabrzon / Ilocos, Davao `</b>
              </li>
              <li>
                If all adsets have the same excluded regions don't insert
                delimeter example <b>`Davao, Mimaropa, Calabrzon`</b> If only{" "}
                <b>PH </b> leave it blank or []
              </li>
            </li>
            <li>
              Use <b>[]</b> for empty Interest List or leave it / / space
            </li>
            <li>
              The system will split these values automatically into groups before
              processing.
            </li>
          </ul>
        </div>

        <div className="flex mb- gap-4">
          <div className="flex mb-4 gap-4">
            <div className="flex flex-col gap-4 mt-5">
              {/* Green Button */}
              <Button
                variant="contained"
                style={{
                  backgroundColor: "green",
                  color: "white",
                  width: "200px",
                }}
                component="label"
                className="py-2"
              >
                Import CSV
                <input type="file" onChange={handleFileUpload} hidden />
              </Button>

              {/* Red Button */}
              <Button
                variant="contained"
                style={{
                  backgroundColor: isRunning ? "gray" : "red",
                  color: "white",
                  width: "200px",
                  cursor: isRunning ? "not-allowed" : "pointer",
                  opacity: isRunning ? 0.6 : 1,
                }}
                onClick={handleRun} // ✅ Always enabled, but blocked inside handleRun if errors exist
                disabled={isRunning} // ❌ No more dependency on isVerified
              >
                {isRunning ? "Running..." : "Run"}
              </Button>

              <Button
                variant="outlined"
                onClick={handleDownloadTemplate}
                className="py-1 text-black"
                style={{ width: "200px" }}
              >
                Download Template
              </Button>

              <Button
                variant="outlined"
                onClick={handleDownloadRegions}
                className="py-1 text-black"
                style={{ width: "200px" }}
              >
                Download List of Regions
              </Button>
            </div>
          </div>

          <div
            className="flex-1 ml-6 mt-5 bg-gray-900 text-white p-4 rounded-md"
            style={{
              height: "220px",
              overflowY: "auto",
              fontFamily: "monospace",
            }}
          >
            <h2 className="text-lg font-bold">Terminal</h2>
            <div>
              {logs.map((log, index) => (
                <p key={index}>{log}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <TableWidget data={data}/>
        </div>
      </div>
  );
};

export default App;
