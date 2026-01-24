// ======================================
// services/plagiarismService.js
// ======================================

class PlagiarismService {
  constructor() {
    this.similarityThreshold = 0.7; // 70% similarity threshold
  }

  async checkPlagiarismService(submissions, assignmentType) {
    const results = [];

    for (let i = 0; i < submissions.length; i++) {
      const currentSubmission = submissions[i];
      const similarities = [];

      for (let j = i + 1; j < submissions.length; j++) {
        const otherSubmission = submissions[j];

        const similarity = await this.calculateSimilarity(
          currentSubmission,
          otherSubmission,
          assignmentType
        );

        if (similarity > this.similarityThreshold) {
          similarities.push({
            submissionId: otherSubmission._id,
            studentId: otherSubmission.student._id,
            studentName: otherSubmission.student.fullName,
            similarity: Math.round(similarity * 100),
          });
        }
      }

      if (similarities.length > 0) {
        results.push({
          submissionId: currentSubmission._id,
          studentId: currentSubmission.student._id,
          studentName: currentSubmission.student.fullName,
          similarity: Math.max(...similarities.map((s) => s.similarity)),
          similarTo: similarities,
        });
      }
    }

    return results;
  }

  async calculateSimilarity(submission1, submission2, assignmentType) {
    let content1, content2;

    switch (assignmentType) {
      case "coding":
        content1 = this.normalizeCode(submission1.content.code || "");
        content2 = this.normalizeCode(submission2.content.code || "");
        break;
      case "writing":
        content1 = this.normalizeText(submission1.content.text || "");
        content2 = this.normalizeText(submission2.content.text || "");
        break;
      case "project":
        content1 = this.normalizeText(
          submission1.content.projectDescription || ""
        );
        content2 = this.normalizeText(
          submission2.content.projectDescription || ""
        );
        break;
      default:
        content1 = JSON.stringify(submission1.content);
        content2 = JSON.stringify(submission2.content);
    }

    if (!content1 || !content2) return 0;

    // Use different algorithms based on content type
    if (assignmentType === "coding") {
      return this.calculateCodeSimilarity(content1, content2);
    } else {
      return this.calculateTextSimilarity(content1, content2);
    }
  }

  normalizeCode(code) {
    return code
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "") // Remove comments
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/[{}();]/g, "\n") // Split on structural elements
      .toLowerCase()
      .trim();
  }

  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove punctuation
      .replace(/\s+/g, " ")
      .trim();
  }

  calculateCodeSimilarity(code1, code2) {
    // Simple structure-based similarity for code
    const lines1 = code1.split("\n").filter((line) => line.trim());
    const lines2 = code2.split("\n").filter((line) => line.trim());

    if (lines1.length === 0 || lines2.length === 0) return 0;

    let matches = 0;
    const maxLines = Math.max(lines1.length, lines2.length);

    for (let i = 0; i < Math.min(lines1.length, lines2.length); i++) {
      if (this.levenshteinSimilarity(lines1[i], lines2[i]) > 0.8) {
        matches++;
      }
    }

    return matches / maxLines;
  }

  calculateTextSimilarity(text1, text2) {
    // Jaccard similarity for text
    const words1 = new Set(text1.split(" ").filter((word) => word.length > 2));
    const words2 = new Set(text2.split(" ").filter((word) => word.length > 2));

    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  levenshteinSimilarity(str1, str2) {
    const matrix = Array(str2.length + 1)
      .fill()
      .map(() => Array(str1.length + 1).fill(0));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[j][i] = matrix[j - 1][i - 1];
        } else {
          matrix[j][i] = Math.min(
            matrix[j - 1][i] + 1,
            matrix[j][i - 1] + 1,
            matrix[j - 1][i - 1] + 1
          );
        }
      }
    }

    const distance = matrix[str2.length][str1.length];
    const maxLen = Math.max(str1.length, str2.length);

    return maxLen === 0 ? 1 : (maxLen - distance) / maxLen;
  }
}

const plagiarismService = new PlagiarismService();

exports.checkPlagiarismService = async (submissions, assignmentType) => {
  return await plagiarismService.checkPlagiarismService(
    submissions,
    assignmentType
  );
};
