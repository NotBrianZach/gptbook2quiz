{ pkgs ? import <nixpkgs> {} }:

let
  # all binary requirements of pdf-extract npm package
  pdftk = pkgs.pdftk;
  pdftotext = pkgs.poppler;
  ghostscript = pkgs.ghostscript;
  tesseractjs = pkgs.tesseract4;
in

pkgs.stdenv.mkDerivation {
  name = "nix-shell-pdftk-pdftotext-ghostscript-tesseractjs";

  buildInputs = [
    pkgs.nodejs

    # reading list util
    pkgs.jq


    # all binary requirements of pdf-extract npm package
    pdftk
    pdftotext
    ghostscript
    tesseractjs
  ];
}
