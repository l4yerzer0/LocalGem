import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Clipboard, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fonts } from '../../theme/colors';
import { useTheme } from '../../theme/useTheme';

interface MarkdownProps {
  content: string;
}

export const MarkdownLite: React.FC<MarkdownProps> = ({ content }) => {
  const theme = useTheme();

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
  };

  const renderContent = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent = "";
    let codeLang = "";

    lines.forEach((line, index) => {
      // Кодовые блоки
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLang = line.replace('```', '').trim();
          codeContent = "";
        } else {
          const finalCode = codeContent.trim();
          elements.push(
            <View key={`code-${index}`} style={[styles.codeBlock, { backgroundColor: theme.codeBg, borderColor: theme.border }]}>
              <View style={[styles.codeHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.codeLang, { color: theme.text.tertiary }]}>{codeLang || 'code'}</Text>
                <TouchableOpacity onPress={() => copyToClipboard(finalCode)} style={styles.copyBtn}>
                  <Text style={[styles.copyText, { color: theme.accent }]}>COPY</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={[styles.codeText, { color: theme.text.primary }]}>{finalCode}</Text>
              </ScrollView>
            </View>
          );
          inCodeBlock = false;
        }
        return;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        return;
      }

      // Заголовки
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s*/, '');
        elements.push(<Text key={index} style={[styles.h, { color: theme.text.primary, fontSize: 24 - level * 2 }]}>{text}</Text>);
        return;
      }

      // Цитаты
      if (line.startsWith('>')) {
        elements.push(
          <View key={index} style={[styles.quote, { borderLeftColor: theme.accent }]}>
            <Text style={[styles.text, { color: theme.text.secondary }]}>{line.replace(/^>\s*/, '')}</Text>
          </View>
        );
        return;
      }

      // Обычный текст с инлайн-стилями (упрощенно)
      if (line.trim() === '') {
        elements.push(<View key={index} style={{ height: 10 }} />);
      } else {
        elements.push(
          <Text key={index} style={[styles.text, { color: theme.text.primary }]}>
            {parseInline(line, theme)}
          </Text>
        );
      }
    });

    return elements;
  };

  const parseInline = (text: string, theme: any) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\$.*?\$|\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
      if (part.startsWith('**')) return <Text key={i} style={styles.bold}>{part.slice(2, -2)}</Text>;
      if (part.startsWith('*')) return <Text key={i} style={styles.italic}>{part.slice(1, -1)}</Text>;
      if (part.startsWith('`')) return <Text key={i} style={[styles.inlineCode, { backgroundColor: theme.codeBg, color: theme.accent }]}>{part.slice(1, -1)}</Text>;
      if (part.startsWith('$')) return <Text key={i} style={[styles.latex, { color: theme.accent }]}>{part.slice(1, -1)}</Text>;
      return part;
    });
  };

  return <View style={styles.container}>{renderContent()}</View>;
};

const styles = StyleSheet.create({
  container: { width: '100%' },
  text: { fontSize: 15, lineHeight: 24, fontFamily: fonts.regular, marginBottom: 4 },
  bold: { fontFamily: fonts.semiBold },
  italic: { fontStyle: 'italic' },
  h: { fontFamily: fonts.serifMedium, marginTop: 16, marginBottom: 8 },
  quote: { borderLeftWidth: 3, paddingLeft: 16, marginVertical: 8 },
  codeBlock: { borderRadius: 12, marginVertical: 12, borderWidth: 1, overflow: 'hidden' },
  codeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1 },
  codeLang: { fontSize: 11, fontFamily: fonts.semiBold, textTransform: 'uppercase' },
  copyBtn: { padding: 4 },
  copyText: { fontSize: 10, fontFamily: fonts.semiBold },
  codeText: { fontFamily: 'monospace', fontSize: 13, padding: 12, lineHeight: 20 },
  inlineCode: { paddingHorizontal: 4, borderRadius: 4, fontFamily: 'monospace', fontSize: 14 },
  latex: { fontFamily: fonts.serifMedium, fontStyle: 'italic' }
});
