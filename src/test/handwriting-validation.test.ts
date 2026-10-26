import {describe,it,expect} from "vitest";
import {validateHandwritingImage,MAX_HANDWRITING_BYTES} from "@/lib/handwriting-validation";
describe("student image validation",()=>{
 it("accepts supported images within size limits",()=>{
  expect(validateHandwritingImage({type:"image/png",size:1024})).toBeNull();
  expect(validateHandwritingImage({type:"image/jpeg",size:MAX_HANDWRITING_BYTES})).toBeNull();
 });
 it("rejects unsupported, zero or oversized files before upload",()=>{
  expect(validateHandwritingImage({type:"application/pdf",size:100})).toMatch(/PNG/);
  expect(validateHandwritingImage({type:"image/png",size:0})).toMatch(/2 MB/);
  expect(validateHandwritingImage({type:"image/webp",size:MAX_HANDWRITING_BYTES+1})).toMatch(/2 MB/);
 });
});
