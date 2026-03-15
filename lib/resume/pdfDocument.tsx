import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { parseResume, ResumeBlock } from "./parser";

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 44,
    paddingHorizontal: 52,
    fontFamily: "Times-Roman",
    fontSize: 10.5,
    lineHeight: 1.5,
    color: "#111111",
  },

  // Header
  name: {
    fontFamily: "Times-Bold",
    fontSize: 20,
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginBottom: 2,
  },
  contactItem: {
    fontSize: 9,
    color: "#444444",
  },
  contactSep: {
    fontSize: 9,
    color: "#aaaaaa",
  },
  headerDivider: {
    borderBottom: "1 solid #cccccc",
    marginTop: 6,
    marginBottom: 2,
  },

  // Section headers
  sectionWrapper: {
    marginTop: 11,
    marginBottom: 4,
    borderBottom: "1.5 solid #111111",
    paddingBottom: 1,
  },
  sectionText: {
    fontFamily: "Times-Bold",
    fontSize: 9,
    letterSpacing: 1.5,
  },

  // Body text with bold support
  textLine: {
    fontSize: 10.5,
    marginBottom: 1.5,
  },
  boldSpan: {
    fontFamily: "Times-Bold",
  },
  normalSpan: {
    fontFamily: "Times-Roman",
  },

  // Bullet
  bulletRow: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 8,
  },
  bulletDot: {
    width: 10,
    fontSize: 10.5,
    marginTop: 0.5,
  },
  bulletText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 1.45,
  },
});

// ─── Bold markdown renderer ───────────────────────────────────────────────────

/**
 * Splits "Hello **World** foo" into [{text:"Hello ", bold:false}, {text:"World", bold:true}, ...]
 * then renders inline Text spans with correct font.
 */
import type { Style } from "@react-pdf/types";

function RichText({ text, style }: { text: string; style: Style }) {
  const segments = splitBold(text);

  // Fast path — no bold markers
  if (segments.length === 1 && !segments[0].bold) {
    return <Text style={style}>{text}</Text>;
  }

  return (
    <Text style={style}>
      {segments.map((seg, i) => (
        <Text key={i} style={seg.bold ? styles.boldSpan : styles.normalSpan}>
          {seg.text}
        </Text>
      ))}
    </Text>
  );
}

function splitBold(text: string): { text: string; bold: boolean }[] {
  const result: { text: string; bold: boolean }[] = [];
  const parts = text.split(/\*\*([^*]+)\*\*/);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) result.push({ text: parts[i], bold: i % 2 === 1 });
  }
  return result;
}

// ─── Block renderer ───────────────────────────────────────────────────────────

function BlockView({ block }: { block: ResumeBlock }) {
  switch (block.type) {
    case "name":
      return <Text style={styles.name}>{block.text.replace(/\*\*/g, "")}</Text>;

    case "contact":
      // Rendered as part of the grouped contact header — skip individual rendering
      return null;

    case "section":
      return (
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionText}>{block.text}</Text>
        </View>
      );

    case "bullet":
      return (
        <View style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <RichText text={block.text} style={styles.bulletText} />
        </View>
      );

    case "text":
      return <RichText text={block.text} style={styles.textLine} />;
  }
}

// ─── Document ─────────────────────────────────────────────────────────────────

interface ResumeDocumentProps {
  text: string;
}

export function ResumeDocument({ text }: ResumeDocumentProps) {
  const blocks = parseResume(text);

  const contactBlocks = blocks.filter((b) => b.type === "contact");
  const nameBlock = blocks.find((b) => b.type === "name");
  const bodyBlocks = blocks.filter((b) => b.type !== "name" && b.type !== "contact");

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Name */}
        {nameBlock && (
          <Text style={styles.name}>{nameBlock.text.replace(/\*\*/g, "")}</Text>
        )}

        {/* Contact — all items on one row, separated by "|" */}
        {contactBlocks.length > 0 && (
          <>
            <View style={styles.contactRow}>
              {contactBlocks.map((b, i) => (
                <Text key={i}>
                  {i > 0 && <Text style={styles.contactSep}> | </Text>}
                  <Text style={styles.contactItem}>{b.text}</Text>
                </Text>
              ))}
            </View>
            <View style={styles.headerDivider} />
          </>
        )}

        {/* Body */}
        {bodyBlocks.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
      </Page>
    </Document>
  );
}
