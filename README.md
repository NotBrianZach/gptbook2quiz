* WIP

* the idea is to take a book pdf


0. read the title and table of contents if it exists, generate a meta summary, or have user provide a meta summary of the book

1. feed pages[n:n+m] into gpt3, prepending the meta summary, generate a summary of pages[n:n+m] and a quiz,
2. display summary of pages[n:n+m] and quiz  to the user, record user answer to quiz
2.5 have gpt attempt to check the answers to made up quiz
3. append the summary of pages[n:n+m] to the meta summary and generate a new meta summary

4. record a log of all the summaries and quizzes


* TO RUN

step 0: be on a ?linux machine? (idk for sure i use nixos) (if it doesn't work on windows subsystem for linux or mac, after downloading nix, feel free to open issue or pull request)

step 1: install nix on your machine

step 2: nix-shell (flake is work in progress)

step 2.5: make a pull request implementing pretty much all the features this project currently needs to be a nice user experience

step 3:	 npm install

step 4:
./book2quiz.sh $OPEN_API_KEY path_2_ur_pdf_here.pdf

step 4.5: open an issue detailing why doesnt work

half steps are slightly facetious
