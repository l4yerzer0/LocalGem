import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Clipboard, ScrollView, Linking } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../../theme/colors';

interface MarkdownLiteProps {
  content: string;
}

export const MarkdownLite: React.FC<MarkdownLiteProps> = ({ content }) => {
  const lines = content.split('\n');
  
  const renderLine = (line: string, index: number) => {
    const trimmed = line.trim();

    // 1. Стандартная обработка заголовков (требуется пробел после #)
    if (line.startsWith('### ')) return <Text key={index} style={styles.h3}>{renderInline(line.slice(4))}</Text>;
    if (line.startsWith('## ')) return <Text key={index} style={styles.h2}>{renderInline(line.slice(3))}</Text>;
    if (line.startsWith('# ')) return <Text key={index} style={styles.h1}>{renderInline(line.slice(2))}</Text>;

    // 2. Чекбоксы
    if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ')) {
      const isChecked = trimmed.startsWith('- [x] ');
      return (
        <View key={index} style={styles.checkItem}>
          <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
            {isChecked && <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><Path d="M20 6L9 17l-5-5" /></Svg>}
          </View>
          <Text style={styles.plainText}>{renderInline(trimmed.slice(6))}</Text>
        </View>
      );
    }

    // 3. Таблицы
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const cells = trimmed.split('|').filter(c => c.length > 0);
        if (cells.every(c => c.trim().match(/^-+$/))) return null;
        return (
            <View key={index} style={styles.tableRow}>
                {cells.map((cell, i) => (
                    <View key={i} style={styles.tableCell}>
                        <Text style={styles.tableText}>{renderInline(cell.trim())}</Text>
                    </View>
                ))}
            </View>
        );
    }

    // 4. Остальное
    if (trimmed === '---') return <View key={index} style={styles.hr} />;
    if (line.startsWith('> ')) {
      return <View key={index} style={styles.quote}><Text style={styles.plainText}>{renderInline(line.slice(2))}</Text></View>;
    }

    const bulletMatch = line.match(/^(\s*)([*+-]|\d+\.)\s+(.*)/);
    if (bulletMatch) {
      const isNumbered = /\d+\./.test(bulletMatch[2]);
      return (
        <View key={index} style={[styles.listItem, { paddingLeft: bulletMatch[1].length * 10 }]}>
          <Text style={styles.bullet}>{isNumbered ? bulletMatch[2] : '•'}</Text>
          <Text style={styles.plainText}>{renderInline(bulletMatch[3])}</Text>
        </View>
      );
    }

    if (trimmed === '') return <View key={index} style={{ height: 8 }} />;
    return <Text key={index} style={styles.plainText}>{renderInline(line)}</Text>;
  };

  const renderInline = (text: string) => {
    // Regex для Bold, Italic, Code, LaTeX и Ссылок [text](url)
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|__.*?__|`.*?`|\$.*?\$|\[.*?\]\(.*?\)|https?:\/\/[^\s]+)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <Text key={i} style={styles.boldText}>{part.slice(2, -2)}</Text>;
      if (part.startsWith('*') && part.endsWith('*')) return <Text key={i} style={styles.italicText}>{part.slice(1, -1)}</Text>;
      if (part.startsWith('`') && part.endsWith('`')) return <Text key={i} style={styles.inlineCode}>{part.slice(1, -1)}</Text>;
      if (part.startsWith('$') && part.endsWith('$')) return <Text key={i} style={styles.latexInline}>{part.slice(1, -1)}</Text>;
      
      // Обработка ссылок [название](url)
      if (part.startsWith('[') && part.includes('](')) {
          const label = part.match(/\[(.*?)\]/)?.[1] || "";
          const url = part.match(/\((.*?)\)/)?.[1] || "";
          return (
            <Text key={i} style={styles.link} onPress={() => Linking.openURL(url)}>
                {label}
            </Text>
          );
      }

      // Прямые ссылки https://...
      if (part.startsWith('http')) {
          return (
            <Text key={i} style={styles.link} onPress={() => Linking.openURL(part)}>
                {part}
            </Text>
          );
      }

      return part;
    });
  };

  const blocks = content.split(/(```[\s\S]*?```|\$\$[\s\S]*?\$\$)/g);

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        if (block.startsWith('```')) {
          const rawCode = block.replace(/```/g, '').trim();
          const lines = rawCode.split('\n');
          const lang = lines[0].length < 12 ? lines[0].toLowerCase() : '';
          const code = lang ? lines.slice(1).join('\n') : rawCode;
          return <CodeBlock key={index} code={code} lang={lang} />;
        }
        if (block.startsWith('$$')) {
            const formula = block.replace(/\$\$/g, '').trim();
            return <View key={index} style={styles.latexBlock}><Text style={styles.latexText}>{formula}</Text></View>;
        }
        return <View key={index}>{block.split('\n').map((line, i) => renderLine(line, i))}</View>;
      })}
    </View>
  );
};

const CodeBlock = ({ code, lang }: { code: string, lang: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        Clipboard.setString(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <View style={styles.codeBlock}>
            <View style={styles.codeHeader}>
                <Text style={styles.codeLang}>{lang || 'CODE'}</Text>
                <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
                    <Text style={styles.copyText}>{copied ? "Готово!" : "Копировать"}</Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={styles.codeText}>{highlightCode(code)}</Text>
            </ScrollView>
        </View>
    );
};

const highlightCode = (code: string) => {
  const keywords = /\b(package|import|func|var|type|struct|return|if|else|for|range|string|int|float64|bool|nil|true|false|def|class|async|await|const|let|from|while|try|except|public|private|static|void|new|include|using|namespace|printf|println|main)\b/g;
  const parts = code.split(keywords);
  return parts.map((part, i) => {
    if (part.match(keywords)) return <Text key={i} style={styles.codeKeyword}>{part}</Text>;
    if (part.startsWith('//') || part.startsWith('#')) return <Text key={i} style={styles.codeComment}>{part}</Text>;
    return part;
  });
};

const styles = StyleSheet.create({
  container: { width: '100%' },
  plainText: { fontSize: 15, lineHeight: 24, fontFamily: fonts.regular, color: '#d1d5db' },
  boldText: { fontFamily: fonts.semiBold, color: '#ffffff' },
  italicText: { fontFamily: fonts.regular, color: '#d1d5db', fontStyle: 'italic' },
  inlineCode: { backgroundColor: '#2b2b28', color: colors.accent, paddingHorizontal: 4, borderRadius: 4, fontFamily: 'monospace', fontSize: 14 },
  link: { color: colors.accent, textDecorationLine: 'underline', fontFamily: fonts.medium },
  h1: { fontSize: 24, fontFamily: fonts.semiBold, color: '#ffffff', marginTop: 24, marginBottom: 12 },
  h2: { fontSize: 20, fontFamily: fonts.semiBold, color: '#ffffff', marginTop: 20, marginBottom: 10 },
  h3: { fontSize: 18, fontFamily: fonts.semiBold, color: '#ffffff', marginTop: 16, marginBottom: 8 },
  quote: { borderLeftWidth: 3, borderLeftColor: colors.accent, paddingLeft: 16, marginVertical: 12, opacity: 0.8 },
  listItem: { flexDirection: 'row', paddingLeft: 4, marginVertical: 2 },
  bullet: { color: colors.accent, marginRight: 10, fontSize: 15, fontFamily: fonts.semiBold },
  hr: { height: 1, backgroundColor: '#333333', marginVertical: 20, width: '100%' },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: colors.text.tertiary, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333333', backgroundColor: '#1a1a1a' },
  tableCell: { flex: 1, padding: 10, borderRightWidth: 1, borderRightColor: '#333333' },
  tableText: { color: '#d1d5db', fontSize: 13, fontFamily: fonts.regular },
  latexInline: { fontFamily: fonts.serifMedium, color: colors.accent, fontStyle: 'italic' },
  latexBlock: { backgroundColor: 'rgba(217, 119, 87, 0.05)', padding: 20, borderRadius: 12, marginVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(217, 119, 87, 0.1)' },
  latexText: { fontFamily: fonts.serifMedium, fontSize: 18, color: colors.text.primary, fontStyle: 'italic' },
  codeBlock: { backgroundColor: '#0d0d0d', borderRadius: 12, marginVertical: 16, borderWidth: 1, borderColor: '#333333', overflow: 'hidden' },
  codeHeader: { backgroundColor: '#1a1a1a', paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333333' },
  codeLang: { fontSize: 10, fontFamily: fonts.semiBold, color: '#888888', textTransform: 'uppercase' },
  copyBtn: { padding: 4 },
  copyText: { fontSize: 10, fontFamily: fonts.semiBold, color: colors.accent },
  codeText: { fontSize: 13, color: '#e6e6e6', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', lineHeight: 20, padding: 16 },
  codeKeyword: { color: '#d97757', fontWeight: 'bold' },
  codeComment: { color: '#6b7280', fontStyle: 'italic' },
});
