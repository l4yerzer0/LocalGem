import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Clipboard, ScrollView, Linking } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../../theme/colors';

interface MarkdownLiteProps {
  content: string;
}

export const MarkdownLite: React.FC<MarkdownLiteProps> = ({ content }) => {
  // Предварительная очистка: заменяем странные символы модели на стандартные
  const cleanContent = content
    .replace(/І/g, '|') // Фикс для галлюцинаций модели с таблицами
    .replace(/“/g, '"')
    .replace(/”/g, '"');

  const blocks = cleanContent.split(/(```[\s\S]*?```|\$\$[\s\S]*?\$\$)/g);

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        if (block.startsWith('```')) {
          const raw = block.replace(/```/g, '');
          const firstLineEnd = raw.indexOf('\n');
          
          let lang = '';
          let code = '';

          if (firstLineEnd !== -1) {
            lang = raw.substring(0, firstLineEnd).trim().toLowerCase();
            code = raw.substring(firstLineEnd + 1).trim();
          } else {
            // Если модель написала ```python print(1)``` в одну строку
            const match = raw.match(/^([a-zA-Z0-9]+)\s+(.*)/);
            if (match) {
                lang = match[1];
                code = match[2];
            } else {
                code = raw.trim();
            }
          }
          return <CodeBlock key={index} code={code} lang={lang} />;
        }
        
        if (block.startsWith('$$')) {
            return <View key={index} style={styles.latexBlock}><Text style={styles.latexText}>{block.replace(/\$\$/g, '').trim()}</Text></View>;
        }

        return <View key={index}>{block.split('\n').map((line, i) => renderLine(line, i))}</View>;
      })}
    </View>
  );
};

const renderLine = (line: string, index: number) => {
    const trimmed = line.trim();
    if (!trimmed && line !== '') return null;

    // Горизонтальная линия
    if (trimmed.match(/^([-*_]){3,}$/)) return <View key={index} style={styles.hr} />;

    // Заголовки (теперь более гибко)
    const hMatch = line.match(/^(#{1,3})\s*(.*)/);
    if (hMatch) {
        const style = hMatch[1].length === 1 ? styles.h1 : hMatch[1].length === 2 ? styles.h2 : styles.h3;
        return <Text key={index} style={style}>{renderInline(hMatch[2])}</Text>;
    }

    // Цитаты
    if (line.startsWith('>')) return <View key={index} style={styles.quote}><Text style={styles.plainText}>{renderInline(line.replace(/^>\s*/, ''))}</Text></View>;

    // Списки (Маркированные и Нумерованные)
    const bulletMatch = line.match(/^(\s*)([*+-]|\d+\.)\s+(.*)/);
    if (bulletMatch) {
      return (
        <View key={index} style={[styles.listItem, { paddingLeft: bulletMatch[1].length * 10 }]}>
          <Text style={styles.bullet}>{bulletMatch[2].includes('.') ? bulletMatch[2] : '•'}</Text>
          <Text style={styles.plainText}>{renderInline(bulletMatch[3])}</Text>
        </View>
      );
    }

    // Таблицы
    if (trimmed.startsWith('|') || trimmed.includes(' | ')) {
        const cells = trimmed.split('|').filter(c => c.trim().length > 0);
        if (cells.every(c => c.trim().match(/^[-:]+$/))) return null;
        if (cells.length > 1) {
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
    }

    return <Text key={index} style={styles.plainText}>{renderInline(line)}</Text>;
};

const renderInline = (text: string) => {
    // Regex для всего инлайна
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|__.*?__|`.*?`|\$.*?\$|\[.*?\]\(.*?\)|https?:\/\/[^\s]+)/g);
    
    return parts.map((part, i) => {
      if (!part) return null;
      if (part.startsWith('**') && part.endsWith('**')) return <Text key={i} style={styles.boldText}>{part.slice(2, -2)}</Text>;
      if (part.startsWith('*') && part.endsWith('*')) return <Text key={i} style={styles.italicText}>{part.slice(1, -1)}</Text>;
      if (part.startsWith('`') && part.endsWith('`')) return <Text key={i} style={styles.inlineCode}>{part.slice(1, -1)}</Text>;
      if (part.startsWith('$') && part.endsWith('$')) return <Text key={i} style={styles.latexInline}>{part.slice(1, -1)}</Text>;
      
      if (part.startsWith('[') && part.includes('](')) {
          const m = part.match(/\[(.*?)\]\((.*?)\)/);
          if (m) return <Text key={i} style={styles.link} onPress={() => Linking.openURL(m[2])}>{m[1]}</Text>;
      }

      if (part.startsWith('http')) return <Text key={i} style={styles.link} onPress={() => Linking.openURL(part)}>{part}</Text>;

      return part;
    });
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
  plainText: { fontSize: 15, lineHeight: 22, fontFamily: fonts.regular, color: '#d1d5db' },
  boldText: { fontFamily: fonts.semiBold, color: '#ffffff' },
  italicText: { fontFamily: fonts.regular, color: '#d1d5db', fontStyle: 'italic' },
  inlineCode: { backgroundColor: '#2b2b28', color: colors.accent, paddingHorizontal: 4, borderRadius: 4, fontFamily: 'monospace', fontSize: 14 },
  link: { color: colors.accent, textDecorationLine: 'underline', fontFamily: fonts.medium },
  h1: { fontSize: 22, fontFamily: fonts.semiBold, color: '#ffffff', marginTop: 16, marginBottom: 8 },
  h2: { fontSize: 19, fontFamily: fonts.semiBold, color: '#ffffff', marginTop: 14, marginBottom: 6 },
  h3: { fontSize: 17, fontFamily: fonts.semiBold, color: '#ffffff', marginTop: 12, marginBottom: 4 },
  quote: { borderLeftWidth: 3, borderLeftColor: colors.accent, paddingLeft: 16, marginVertical: 8, opacity: 0.8 },
  listItem: { flexDirection: 'row', paddingLeft: 4, marginVertical: 1 },
  bullet: { color: colors.accent, marginRight: 10, fontSize: 15, fontFamily: fonts.semiBold },
  hr: { height: 1, backgroundColor: '#333333', marginVertical: 16, width: '100%' },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  checkbox: { width: 16, height: 18, borderRadius: 4, borderWidth: 2, borderColor: colors.text.tertiary, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333333', backgroundColor: '#1a1a1a' },
  tableCell: { flex: 1, padding: 8, borderRightWidth: 1, borderRightColor: '#333333' },
  tableText: { color: '#d1d5db', fontSize: 12, fontFamily: fonts.regular },
  latexInline: { fontFamily: fonts.serifMedium, color: colors.accent, fontStyle: 'italic' },
  latexBlock: { backgroundColor: 'rgba(217, 119, 87, 0.05)', padding: 16, borderRadius: 12, marginVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(217, 119, 87, 0.1)' },
  latexText: { fontFamily: fonts.serifMedium, fontSize: 17, color: colors.text.primary, fontStyle: 'italic' },
  codeBlock: { backgroundColor: '#0d0d0d', borderRadius: 12, marginVertical: 12, borderWidth: 1, borderColor: '#333333', overflow: 'hidden' },
  codeHeader: { backgroundColor: '#1a1a1a', paddingHorizontal: 16, paddingVertical: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333333' },
  codeLang: { fontSize: 9, fontFamily: fonts.semiBold, color: '#888888', textTransform: 'uppercase' },
  copyBtn: { padding: 4 },
  copyText: { fontSize: 9, fontFamily: fonts.semiBold, color: colors.accent },
  codeText: { fontSize: 13, color: '#e6e6e6', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', lineHeight: 18, padding: 12 },
  codeKeyword: { color: '#d97757', fontWeight: 'bold' },
  codeComment: { color: '#6b7280', fontStyle: 'italic' },
});
