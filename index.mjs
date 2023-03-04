#!/usr/bin/env node

console.log("first")
import {program} from 'commander';
import fs from 'fs';
import { Configuration, OpenAIApi } from "openai";

console.log(process.argv)

program
  .version('0.1.0')
  .option('-f, --file <file>', 'Path to PDF file')
  .parse(process.argv)
//  .action((str, options) => {
//    console.log("action")
//    console.log(str,options)
//    const limit = options.first ? 1 : undefined;
//    console.log(str.split(options.separator, limit));
//  });

const options = program.opts();
// console.log(options)
if (!options.file) {
  console.error('No file specified e.g. ./google_sre_2_2018.pdf');
  process.exit(1);
}


// https://www.npmjs.com/package/pdf-extract
// Text extract from searchable pdf
// eyes is optional console.log replacement
// import inspect from 'eyes'.
// inspect.inspector({maxLength:20000});
import pdf_extract from 'pdf-extract';
// var absolute_path_to_pdf = '~/Downloads/electronic.pdf'
var pdfOptions = {
  type: 'text'  // extract the actual text in the pdf file
}


const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

var processor = pdf_extract(options.file, pdfOptions, function(err) {
  if (err) {
    return callback(err);
  }
});
processor.on('complete', async function(data) {
  console.log(data.text_pages[0], 'extracted text page 1');
  function removeExtraWhitespace(str) {
    return str.replace(/\s+/g, ' ').trim();
  }
  // const text = removeExtraWhitespace(data.text_pages[0]);
  // console.log(text);
  // const prompt = `This is a summary of the paper: ${text}
  // Summary:
  // `;
  // const completion = openai.complete({
  //   prompt,
  //   engine: "davinci",
  //   maxTokens: 4000,
  //   temperature: 0.9,
  //   topP: 1,
  //   frequencyPenalty: 0,
  //   presencePenalty: 0,
  //   bestOf: 1,
  //   n: 1,
  //   stream: false
  // });
  // completion.then((response) => {
  //   console.log(response.data.choices[0].text);
  // });

  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `What follows is the first few pages of a pdf, please summarize it and then generate a quiz over the contents: ${removeExtraWhitespace(data.text_pages[0] + data.text_pages[1])}`,
    max_tokens: 2000
  });

  console.log("What follows is the first few pages of a pdf, please summarize it and then generate a quiz over the contents:", completion.data.choices);

  const completion2 = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `What follows is the text of the first few pages of a pdf, What is the title? ${removeExtraWhitespace(data.text_pages[0])}`,
    max_tokens: 2000
  });

  console.log(`What is the title?`, completion2.data.choices);

  // callback(null, data.text_pages);
});

processor.on('error', function(err) {
  console.log(err, 'error while extracting pages');
  // return callback(err);
});







// Extract from a pdf file which contains a scanned image and no searchable text

// var inspect = require('eyes').inspector({maxLength:20000});
// var pdf_extract = require('pdf-extract');
// var absolute_path_to_pdf = '~/Downloads/sample.pdf'
// var options = {
//   type: 'ocr' // perform ocr to get the text within the scanned image
// }

// var processor = pdf_extract(absolute_path_to_pdf, options, function(err) {
//   if (err) {
//     return callback(err);
//   }
// });
// processor.on('complete', function(data) {
//   inspect(data.text_pages, 'extracted text pages');
//   callback(null, text_pages);
// });
// processor.on('error', function(err) {
//   inspect(err, 'error while extracting pages');
//   return callback(err);
// });
