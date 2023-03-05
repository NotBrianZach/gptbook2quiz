#!/usr/bin/env node
console.log("first");
import { program } from "commander";
import fs from "fs";
import prompt from "prompt";
import { Configuration, OpenAIApi } from "openai";
import pdf_extract from "pdf-extract";
console.log(process.argv);

function isValidObject(str) {
  try {
    const obj = JSON.parse(str);
    return typeof obj === "object" && obj !== null;
  } catch (e) {
    return false;
  }
}

program
  .version("0.1.0")
  .option("-f, --file <file>", "Path to PDF file")
  .option("-p, --page <page>", "current page number")
  .option("-c, --chunkSize <chunkSize>", "number of pages to read at once")
  .parse(process.argv);
const options = program.opts();
// console.log(options)
if (!options.file) {
  console.error("No file specified e.g. ./google_sre_2_2018.pdf");
  process.exit(1);
}
var pdfOptions = {
  type: "text", // extract the actual text in the pdf file
  clean: true // prevent tmp directory /usr/run/$userId$ from overfilling with parsed pdf pages
};
const openAIConfiguration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(openAIConfiguration);
var processor = pdf_extract(options.file, pdfOptions, function(err) {
  if (err) {
    return callback(err);
  }
});
let metaSummary = "";
let logSummary = [];
let logQuiz = [];
const currentPageNumber = options.page !== undefined ? 0 : options.page;
const chunkSize = options.chunkSize !== undefined ? 2 : options.chunkSize;
processor.on("complete", async function(data) {
  // console.log(data.text_pages[0], "extracted text page 1");
  const totalPages = data.text_pages.length;

  function removeExtraWhitespace(str) {
    return str.replace(/\s+/g, " ").trim();
  }
  const completionTitle = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `What follows is the text of the first few pages of a pdf, output the title in json format { "titleKey": title } ${removeExtraWhitespace(
      data.text_pages
        .slice(currentPageNumber, currentPageNumber + chunkSize)
        .join("")
    )}`,
    max_tokens: 2000
  });
  let title = completionTitle.data.choices[0].txt;
  console.log("attempt to extract title", title);
  if (!isValidObject(title)) {
    const { inputTitle } = await prompt.get(["inputTitle"]);
    title = inputTitle;
  }
  while (currentPageNumber + chunkSize < totalPages) {
    const pageSlice = removeExtraWhitespace(
      data.text_pages
        .slice(currentPageNumber, currentPageNumber + chunkSize)
        .join("")
    );
    const summaryCompletion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Summarize the following TEXT exerpt and book SYNOPSIS, TEXT: ${pageSlice} SYNOPSIS: ${metaSummary}`,
      max_tokens: 2000
    });
    console.log(
      `Summary of pages ${currentPageNumber} to${currentPageNumber +
        chunkSize}:`,
      summaryCompletion.data.choices[0].txt
    );
    logSummary.push(summaryCompletion.data.choices[0].txt);
    await prompt.get(["Press any key to continue to quiz"]);

    const completionQuiz = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `$SUMMARY$: ${metaSummary} $CONTENT$: ${pageSlice} $INSTRUCTIONS$: given $SUMMARY$ and $CONTENT$ generate a quiz bank of questions to test knowledge of $CONTENT$`,
      max_tokens: 2000
    });
    console.log(`Quiz:`, completionQuiz.data.choices[0].txt);
    logQuiz.push(completionQuiz.data.choices[0].txt);
    const { answers } = await prompt.get(["Record answers here"]);

    const completionCheckAnswers = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: ``,
      max_tokens: 2000
    });
    //append the summary of pages[n:n+m] to the meta summary and generate a new meta summary
    metaSummary = metaSummary + completion.data.choices[0].txt;
  }

  //TODO? have gpt attempt to check the answers to made up quiz
  // const completionCheckAnswers = await openai.createCompletion({
  //   model: "text-davinci-003",
  //   prompt: `What is the correct answer for the quiz above? ${userAnswer}`,
  //   max_tokens: 2000
  // });
  // console.log(`Check answer:`, completionCheckAnswers.data.choices[0].txt);

  console.log(`New Meta Summary:`, metaSummary);
});

//record a log of all the summaries and quizzes
//logSummary and logQuiz are already populated with the summaries and quizzes
// console.log(logSummary);
// console.log(logQuiz);
