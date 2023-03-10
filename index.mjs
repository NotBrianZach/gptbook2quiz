#!/usr/bin/env node
import { program } from "commander";
import fs from "fs";
import prompt from "prompt";
import { Configuration, OpenAIApi } from "openai";
import pdf_extract from "pdf-extract";
console.log(process.argv);
readingList = fs.readFileSync(path.resolve(""))

program
  .version("0.1.0")
  .option("-f, --file <file>", "Path to PDF file")
  .option("-p, --page <page>", "current page number")
  .option("-c, --chunkSize <chunkSize>", "number of pages to read at once")
//TODO .option("-t, --type <type>", "pdf, html")
  .parse(process.argv);
const options = program.opts();
console.log(options);
if (!options.file) {
  console.error("No file specified e.g. ./google_sre_2_2018.pdf");
  process.exit(1);
}
var pdfOptions = {
  type: "text", // extract the actual text in the pdf file
  clean: true // try prevent tmp directory /usr/run/$userId$ from overfilling with parsed pdf pages (doesn't seem to work)
};
const openAIConfiguration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

function removeExtraWhitespace(str) {
  // removes any instance of two or whitespace (text often has tons of padding characers), and whitespace from end and beginning of str
  return str.replace(/\s+/g, " ").trim();
}

const openai = new OpenAIApi(openAIConfiguration);
var processor = pdf_extract(options.file, pdfOptions, function(err) {
  if (err) {
    return callback(err);
  }
});

let synopsis = "";
let logSummary = [];
let logQuiz = [];
const currentPageNumber = options.page === undefined ? 0 : options.page;
const chunkSize = options.chunkSize === undefined ? 2 : options.chunkSize;
function eventLoop(data) {
  const totalPages = data.text_pages.length;
  console.log("totalPages", totalPages, currentPageNumber, chunkSize);

  // 0. read the title and table of contents if it exists, generate a meta summary, or have user provide a meta summary of the book
  const titlePrompt = `What follows is the text of the first few pages of a pdf, output the title: ${removeExtraWhitespace(
    data.text_pages
      .slice(currentPageNumber, currentPageNumber + chunkSize)
      .join("")
  )}`;
  console.log("titlePrompt", titlePrompt);
  const titleCompletion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: titlePrompt,
    max_tokens: 2000
  });
  let potentialTitle = titleCompletion.data.choices[0].text;
  var titlePromptSchema = {
    properties: {
      validTitle: {
        message:
        "Press C if title correct, otherwise enter title",
        required: true
      }
    }
  };
  const { inputTitle } = await prompt.get(["inputTitle"]);

  while (currentPageNumber + chunkSize < totalPages) {
    const pageSlice = removeExtraWhitespace(
      data.text_pages
        .slice(currentPageNumber, currentPageNumber + chunkSize)
        .join("")
    );

    // 1. feed pages[n:n+m] into gpt3, prepending the meta summary, generate a summary of pages[n:n+m] and a quiz,
    const summaryCompletion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Summarize the following TEXT exerpt and book SYNOPSIS from book w/title: ${title}, TEXT: ${pageSlice} SYNOPSIS: ${synopsis}`,
      max_tokens: 2000
    });
    //2. display summary of pages[n:n+m] and quiz  to the user, record user answer to quiz
    console.log(
      `Summary of pages ${currentPageNumber} to ${currentPageNumber +
        chunkSize}:`,
      summaryCompletion.data.choices[0].text
    );
    logSummary.push(summaryCompletion.data.choices[0].text);
    await prompt.get(["Press any a letter+enter to continue to quiz"]);

    const completionQuiz = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `$SUMMARY$: ${synopsis} $CONTENT$: ${pageSlice} $INSTRUCTIONS$: given $SUMMARY$ and $CONTENT$ of book titled "${title}" generate a quiz bank of questions to test knowledge of $CONTENT$`,
      max_tokens: 2000
    });
    console.log(`Quiz:`, completionQuiz.data.choices[0].text);
    logQuiz.push(completionQuiz.data.choices[0].text);
    const { answers } = await prompt.get(["Record answers here or single char input&enter to continue"]);

    //?TODO? have gpt attempt to check the answers to made up quiz
    // const completionCheckAnswers = await openai.createCompletion({
    //   model: "text-davinci-003",
    //   prompt: `What is the correct answer for the quiz above? ${userAnswer}`,
    //   max_tokens: 2000
    // });
    // console.log(`Check answer:`, completionCheckAnswers.data.choices[0].text);

    //3. append the summary of pages[n:n+m] to the meta summary and generate a new meta summary
    const updateMetaSummaryCompletion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `given $SUMMARY$ of book titled ${title.titleKey}${synopsis} $CONTENT$: ${pageSlice} $INSTRUCTIONS$: given $SUMMARY$ and $CONTENT$ of book titled "${title}" generate a quiz bank of questions to test knowledge of $CONTENT$`,
      max_tokens: 2000
    });
    synopsis = updateMetaSummaryCompletion.data.choices[0].text;
    console.log(`New Meta Summary:`, synopsis);
    var finalPromptSchema = {
      properties: {
        isExit: {
          message:
            "Press any key except X to continue to next ${chunkSize} page(s), press X to save logs and exit program",
          required: true
        }
      }
    };
    const { isExit } = await prompt.get(finalPromptSchema);
    if (isExit === "X") {
      break;
    }
  }

  const summary = {
    synopsis,
    logSummary,
    logQuiz
  }
  console.log(summary);
  // 4. record a log of all the summaries and quizzes
  fs.writeFileSync(
    `./log.json`,
    JSON.stringify(summary)
  );
}

processor.on("complete", async function(pdfText) {
  // console.log(data.text_pages[0], "extracted text page 1");
  eventLoop(pdfText)
});
