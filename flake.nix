{
  description = "Nix Flake for pdftk, pdftotext, ghostscript and tesseract.js";
  inputs = {
    pdftk = {
      url = "https://nixos.org/releases/nixpkgs/nixpkgs-19.03/pdftk-3.0.6.tar.gz";
      sha256 = "abcd1234";
    };
    pdftotext = {
      url = "https://nixos.org/releases/nixpkgs/nixpkgs-19.03/pdftotext-3.0.6.tar.gz";
      sha256 = "efgh5678";
    };
    ghostscript = {
      url = "https://nixos.org/releases/nixpkgs/nixpkgs-19.03/ghostscript-9.07.tar.gz";
      sha256 = "ijkl9012";
    };
    tesseractjs = {
      url = "https://nixos.org/releases/nixpkgs/nixpkgs-19.03/tesseract.js-0.2.0.tar.gz";
      sha256 = "mnop3456";
    };
  };
  outputs = { self, nixpkgs, pdftk, pdftotext, ghostscript, tesseractjs }:
  {
    nix-shell-pdftk-pdftotext-ghostscript-tesseractjs =
      nixpkgs.stdenv.mkDerivation {
        name = "nix-shell-pdftk-pdftotext-ghostscript-tesseractjs";
        buildInputs = [
          pdftk
          pdftotext
          ghostscript
          tesseractjs
        ];
      };
  };
}
