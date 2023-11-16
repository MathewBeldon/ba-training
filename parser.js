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
	let reversedData = inputData.data.reverse();

	const createMessage = (role, content) => {
		return {
			role,
			content,
		};
	};

	/* 
    Note: we assume that each content list 
    will only have 1 object. Is this always the case?
    */
	const messages = reversedData.map((input) => {
		return createMessage(input.role, input.content[0].text.value);
	});

	const jsonLFormat = { messages: messages };

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
