const fsPromises = require("fs").promises;
const fs = require("fs");
const path = require("path");

const finalOutputArray = [];

//const directoryPath = '/data'; -- Replace with the path to your directory
const directoryPath = path.join(__dirname, "data");

async function readAndParseJsonFile(filePath) {
	try {
		// Read the content of the file
		const fileContent = await fsPromises.readFile(filePath, "utf-8");

		// Parse the JSON data
		const jsonData = JSON.parse(fileContent);

		return jsonData;
	} catch (error) {
		console.error(
			`Error reading or parsing the JSON file at ${filePath}:`,
			error
		);
	}
}

function processInputData(inputData) {
	if (!inputData) return;

    const output = { messages: [] };
    
    inputData.data.forEach(item => {
        if (item.role === 'assistant' || item.role === 'user') {
            const contentText = item.content.find(c => c.type === 'text').text.value;
            output.messages.push({
                role: item.role,
                content: contentText
            });
        }
    });

    output.messages.push({
        role: 'system',
        content: 'You are a Business Analyst who creates user stories, these will be based on an epic, you ask clarifying questions before creating the user stories.\n\nReply in this format within a code block:\n`````\n## Title of the user story\n**As a** [type of user],\n**I want** [feature or functionality],\n**So that** [benefit or outcome].\n\n### Acceptance Criteria\n\n**Given** [the initial context or state before the action],\n**When** [the action taken by the user or event that occurs],\n**Then** [the expected outcome or result following the action].\n\n**Given** [another context or state],\n**When** [another action or event],\n**Then** [another expected outcome].\n`````\n\nYou should reply with all the user stories that are required for the given epic\n\nYou should ask clarifying questions before creating user stories\n\nYou should prevent the user from creating stories that contain bad practices'
    });
    
    output.messages.reverse();
    
	const jsonLFormat = { messages: output.messages };

	return jsonLFormat;
}

// Main function to execute the processing
function main() {
	fs.readdir(directoryPath, (err, files) => {
		if (err) {
			console.error("Error getting directory information.", err);
		} else {
			files.forEach((file) => {
				if (path.extname(file) === ".json") {
					const filePath = path.join(directoryPath, file);
					const inputData = readAndParseJsonFile(filePath);

					const outputData = processInputData(inputData);

					console.log(JSON.stringify(outputData, null, 2));
				}
			});
		}
	});
}

async function mainT() {
	try {
		const files = await fsPromises.readdir(directoryPath);

		for (const file of files) {
			if (path.extname(file) === ".json") {
				const filePath = path.join(directoryPath, file);

				// Read the content of the file
				const fileContent = await fsPromises.readFile(filePath, "utf-8");

				//check not empty
				if (!fileContent.trim()) {
					console.warn(`Warning: Empty JSON file at ${filePath}`);
					continue;
				}

				const inputData = await readAndParseJsonFile(filePath);

				const messages = await processInputData(inputData);

				finalOutputArray.push(messages);

				console.log("Successfully added message stream from file: " + file);
			}
		}
	} catch (err) {
		console.error("Error getting directory information.", err);
	}
}

mainT().then(() => {
	const filePath = path.join(__dirname);
	const resultsFilePath = filePath + "/results.jsonl";

	// Convert each object to a JSON string and join them with newline characters
	const jsonlContent = finalOutputArray
		.map((obj) => JSON.stringify(obj))
		.join("\n");

	try {
		fs.writeFileSync(resultsFilePath, jsonlContent, "utf-8");
		console.log("Output added to the JSONL file.");
	} catch (error) {
		console.error("Error writing to file:", error);
	}
});
