const text = `Here is the JSON you requested:
{
  "key": "value"
}
I hope this helps!`;

const match = text.match(/\{[\s\S]*\}/);
if (match) {
  console.log("Matched:", match[0]);
} else {
  console.log("No match");
}
