import { describe, expect, it } from "vitest";

import { escapeHtml, join, raw, tag } from "../../../src/cvPage/html";

// F-032
describe("CV page HTML builder", () => {
  it("escapes the characters that could break out of text or an attribute", () => {
    expect(escapeHtml(`<b class="x">Tom & Jerry's</b>`)).toBe(
      "&lt;b class=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/b&gt;",
    );
  });

  it("escapes text children and attribute values, never raw HTML", () => {
    const html = tag(
      "a",
      { href: `/x?a=1&b="2"` },
      "<script>",
      raw("<em>ok</em>"),
    );

    expect(html.html).toBe(
      `<a href="/x?a=1&amp;b=&quot;2&quot;">&lt;script&gt;<em>ok</em></a>`,
    );
  });

  it("leaves out empty children and attributes", () => {
    const html = tag(
      "p",
      { class: "a", hidden: false, title: undefined },
      false,
      null,
      undefined,
      ["one", false, "two"],
    );

    expect(html.html).toBe(`<p class="a">onetwo</p>`);
  });

  it("joins children into one piece of HTML", () => {
    expect(join(["a", raw("<br>"), "b"])).toBe("a<br>b");
  });
});
