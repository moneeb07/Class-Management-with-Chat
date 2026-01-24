// ======================================
// services/aiEvaluationService.js
// ======================================

class AIEvaluationService {
  constructor() {
    // In production, you'd integrate with OpenAI API, Google AI, etc.
    this.mockMode = true; // Set to false when integrating with real AI service
  }

  async generateAIFeedback(submission, assignment) {
    if (this.mockMode) {
      return this.generateMockFeedback(submission, assignment);
    }

    // Real AI integration would go here
    // Example with OpenAI:
    /*
    const response = await openai.createCompletion({
      model: 'gpt-4',
      prompt: this.buildPrompt(submission, assignment),
      max_tokens: 1000,
      temperature: 0.7
    });
    
    return this.parseAIResponse(response.data.choices[0].text);
    */
  }

  generateMockFeedback(submission, assignment) {
    const feedback = {
      overallScore: 0,
      confidence: 0.8,
      feedback: "",
      detailedAnalysis: {},
      suggestions: [],
      evaluatedAt: new Date(),
      model: "mock-ai-v1",
    };

    switch (assignment.type) {
      case "coding":
        return this.generateCodingFeedback(submission, assignment, feedback);
      case "writing":
        return this.generateWritingFeedback(submission, assignment, feedback);
      case "project":
        return this.generateProjectFeedback(submission, assignment, feedback);
      default:
        return this.generateGenericFeedback(submission, assignment, feedback);
    }
  }

  generateCodingFeedback(submission, assignment, feedback) {
    const code = submission.content.code || "";
    const testResults = submission.codingResults || {};

    // Analyze code quality
    const codeQuality = this.analyzeCodeQuality(code);
    const testScore =
      (testResults.passedTestCases / Math.max(testResults.totalTestCases, 1)) *
      100;

    feedback.overallScore = Math.round(
      testScore * 0.7 + codeQuality.overall * 0.3
    );
    feedback.detailedAnalysis = {
      codeQuality: codeQuality.overall,
      logic: codeQuality.logic,
      efficiency: codeQuality.efficiency,
      readability: codeQuality.readability,
      plagiarismScore: submission.plagiarismScore || 0,
    };

    feedback.feedback = `Code analysis complete. Test cases passed: ${testResults.passedTestCases}/${testResults.totalTestCases}. `;
    feedback.feedback += codeQuality.feedback;

    feedback.suggestions = codeQuality.suggestions;

    return feedback;
  }

  generateWritingFeedback(submission, assignment, feedback) {
    const text = submission.content.text || "";
    const wordCount = submission.content.wordCount || 0;

    const writingAnalysis = this.analyzeWritingQuality(text);

    // Check word count compliance
    let wordCountScore = 100;
    if (assignment.writingSettings.wordLimit) {
      const ratio = wordCount / assignment.writingSettings.wordLimit;
      if (ratio > 1.1) wordCountScore -= 20; // Over limit penalty
      if (ratio < 0.8) wordCountScore -= 10; // Under limit penalty
    }

    feedback.overallScore = Math.round(
      writingAnalysis.overall * 0.8 + wordCountScore * 0.2
    );
    feedback.detailedAnalysis = {
      clarity: writingAnalysis.clarity,
      structure: writingAnalysis.structure,
      grammar: writingAnalysis.grammar,
      vocabulary: writingAnalysis.vocabulary,
      wordCountCompliance: wordCountScore,
    };

    feedback.feedback = `Writing analysis: Word count ${wordCount}. ${writingAnalysis.feedback}`;
    feedback.suggestions = writingAnalysis.suggestions;

    return feedback;
  }

  generateProjectFeedback(submission, assignment, feedback) {
    const description = submission.content.projectDescription || "";
    const hasDemo = !!submission.content.demoLink;
    const hasRepo = !!submission.content.repositoryLink;

    let score = 70; // Base score

    if (description.length > 200) score += 10;
    if (hasDemo) score += 10;
    if (hasRepo) score += 10;

    feedback.overallScore = Math.min(score, 100);
    feedback.detailedAnalysis = {
      documentation: description.length > 100 ? 85 : 60,
      completeness: hasDemo && hasRepo ? 90 : 70,
      presentation: hasDemo ? 85 : 60,
    };

    feedback.feedback = `Project submission reviewed. Documentation quality: ${feedback.detailedAnalysis.documentation}%. `;
    feedback.feedback += hasDemo
      ? "Demo link provided. "
      : "Consider adding a demo link. ";
    feedback.feedback += hasRepo
      ? "Repository link provided."
      : "Repository link missing.";

    feedback.suggestions = [
      "Ensure all project requirements are met",
      "Document your implementation decisions",
      "Include screenshots or examples in documentation",
    ];

    return feedback;
  }

  generateGenericFeedback(submission, assignment, feedback) {
    feedback.overallScore = Math.floor(Math.random() * 30) + 70; // 70-100 range
    feedback.feedback =
      "Assignment submitted successfully. Detailed review pending.";
    feedback.suggestions = [
      "Review assignment requirements carefully",
      "Ensure all sections are complete",
      "Check formatting and presentation",
    ];

    return feedback;
  }

  analyzeCodeQuality(code) {
    const analysis = {
      overall: 75,
      logic: 80,
      efficiency: 70,
      readability: 75,
      feedback: "",
      suggestions: [],
    };

    // Simple heuristic analysis
    const lines = code.split("\n").filter((line) => line.trim());
    const totalLines = lines.length;

    // Check for comments
    const commentLines = lines.filter(
      (line) =>
        line.trim().startsWith("//") ||
        line.trim().startsWith("#") ||
        line.includes("/*")
    ).length;

    const commentRatio = commentLines / Math.max(totalLines, 1);

    if (commentRatio > 0.1) {
      analysis.readability += 10;
      analysis.feedback += "Good use of comments. ";
    } else {
      analysis.suggestions.push("Add more comments to explain your logic");
    }

    // Check for proper variable naming (basic heuristic)
    const hasDescriptiveNames =
      /\b(count|sum|total|result|data|user|item)\b/i.test(code);
    if (hasDescriptiveNames) {
      analysis.readability += 5;
    } else {
      analysis.suggestions.push("Use more descriptive variable names");
    }

    // Check for nested loops (efficiency concern)
    const nestedLoopCount = (code.match(/for.*\n.*for/g) || []).length;
    if (nestedLoopCount > 2) {
      analysis.efficiency -= 15;
      analysis.suggestions.push("Consider optimizing nested loops");
    }

    // Calculate overall score
    analysis.overall = Math.round(
      (analysis.logic + analysis.efficiency + analysis.readability) / 3
    );

    return analysis;
  }

  analyzeWritingQuality(text) {
    const analysis = {
      overall: 75,
      clarity: 80,
      structure: 75,
      grammar: 85,
      vocabulary: 70,
      feedback: "",
      suggestions: [],
    };

    const words = text.split(/\s+/).filter((word) => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    // Average sentence length
    const avgSentenceLength = words.length / Math.max(sentences.length, 1);

    if (avgSentenceLength > 25) {
      analysis.clarity -= 10;
      analysis.suggestions.push(
        "Consider shorter sentences for better clarity"
      );
    }

    // Check for paragraph structure (basic heuristic)
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    if (paragraphs.length < 3 && words.length > 200) {
      analysis.structure -= 15;
      analysis.suggestions.push("Organize content into clear paragraphs");
    }

    // Vocabulary diversity
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
    const vocabularyRatio = uniqueWords.size / Math.max(words.length, 1);

    if (vocabularyRatio > 0.6) {
      analysis.vocabulary += 10;
    } else if (vocabularyRatio < 0.3) {
      analysis.vocabulary -= 10;
      analysis.suggestions.push("Use more varied vocabulary");
    }

    analysis.overall = Math.round(
      (analysis.clarity +
        analysis.structure +
        analysis.grammar +
        analysis.vocabulary) /
        4
    );
    analysis.feedback = `Text contains ${words.length} words in ${sentences.length} sentences. `;

    return analysis;
  }
}

const aiEvaluationService = new AIEvaluationService();

exports.generateAIFeedback = async (submission, assignment) => {
  return await aiEvaluationService.generateAIFeedback(submission, assignment);
};
