#!/usr/bin/env node
console.log("first");
import { program } from "commander";
import fs from "fs";
import prompt from "prompt";
import { Configuration, OpenAIApi } from "openai";
console.log(process.argv);
const pompt = require("prompt");

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
import pdf_extract from "pdf-extract";
// var absolute_path_to_pdf = '~/Downloads/electronic.pdf'
var pdfOptions = {
  type: "text", // extract the actual text in the pdf file
  clean: true // prevent tmp directory /usr/run/$userId$ from overfilling with parsed pdf pages
};
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);
var processor = pdf_extract(options.file, pdfOptions, function(err) {
  if (err) {
    return callback(err);
  }
});
let metaSummary = "";
let logSummary = [];
let logQuiz = [];
const currentPageNumber = options.page !== undefined ? 0 : options.page;
const chunkSize = options.chunkSize !== undefined ? 0 : options.page;
processor.on("complete", async function(data) {
  // console.log(data.text_pages[0], "extracted text page 1");
  const totalPages = data.text_pages.length;

  function removeExtraWhitespace(str) {
    return str.replace(/\s+/g, " ").trim();
  }
  if (metaSummary === "") {
    const completionTitle = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `What follows is the text of the first few pages of a pdf, output the title in json format { "titleKey": title } ${removeExtraWhitespace(
        data.text_pages[0]
      )}`,
      max_tokens: 2000
    });
    title = completionTitle.data.choices[0].txt;

    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Please summarize the pages ${data.text_pages.slice} to ${data.text_pages[1]} and generate a quiz over the contents:`,
      max_tokens: 2000
    });
  }
  console.log(
    `Summary of pages ${data.text_pages[0]} to ${data.text_pages[1]}:`,
    completion.data.choices[0].txt
  );
  logSummary.push(completion.data.choices[0].txt);

  const completionQuiz = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `Please generate a quiz over the contents of the pages ${data.text_pages[0]} to ${data.text_pages[1]}`,
    max_tokens: 2000
  });
  console.log(`Quiz:`, completionQuiz.data.choices[0].txt);
  logQuiz.push(completionQuiz.data.choices[0].txt);
  pomp.start();
  pomp.get();

  //record user answer to quiz
  const userAnswer = prompt(completionQuiz.data.choices[0].txt);

  //have gpt attempt to check the answers to made up quiz
  const completionCheckAnswers = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `What is the correct answer for the quiz above? ${userAnswer}`,
    max_tokens: 2000
  });
  console.log(`Check answer:`, completionCheckAnswers.data.choices[0].txt);

  //append the summary of pages[n:n+m] to the meta summary and generate a new meta summary
  metaSummary = metaSummary + completion.data.choices[0].txt;
  console.log(`New Meta Summary:`, metaSummary);
});

//record a log of all the summaries and quizzes
//logSummary and logQuiz are already populated with the summaries and quizzes
console.log(logSummary);
console.log(logQuiz);
