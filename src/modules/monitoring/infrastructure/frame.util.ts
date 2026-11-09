/** JPEG files start with the SOI marker FF D8 followed by another marker (FF). */
export function isJpeg(data: Buffer): boolean {
  return (
    data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
  );
}
