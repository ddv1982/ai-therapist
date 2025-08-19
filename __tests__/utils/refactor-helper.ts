/**
 * Test Refactoring Helper
 * Automated utilities to help migrate existing tests to use the unified architecture
 * 
 * This helper provides:
 * - Pattern detection and replacement suggestions
 * - Automated mock conversion
 * - Performance analysis of existing tests
 * - Migration reports and recommendations
 */

import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// PATTERN DETECTION AND ANALYSIS
// =============================================================================

interface TestFileAnalysis {
  filePath: string;
  linesOfCode: number;
  duplicatePatterns: Array<{
    pattern: string;
    occurrences: number;
    canOptimize: boolean;
  }>;
  mockSetupComplexity: number;
  performanceIssues: string[];
  optimizationPotential: number; // Percentage
}

export class TestRefactorHelper {
  
  /**
   * Analyze a test file for optimization opportunities
   */
  static analyzeTestFile(filePath: string): TestFileAnalysis {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const analysis: TestFileAnalysis = {
      filePath,
      linesOfCode: lines.length,
      duplicatePatterns: [],
      mockSetupComplexity: 0,
      performanceIssues: [],
      optimizationPotential: 0,
    };

    // Detect common duplicate patterns
    const patterns = this.detectDuplicatePatterns(content);
    analysis.duplicatePatterns = patterns;

    // Analyze mock complexity
    analysis.mockSetupComplexity = this.analyzeMockComplexity(content);

    // Detect performance issues
    analysis.performanceIssues = this.detectPerformanceIssues(content);

    // Calculate optimization potential
    analysis.optimizationPotential = this.calculateOptimizationPotential(analysis);

    return analysis;
  }

  /**
   * Detect duplicate testing patterns
   */
  private static detectDuplicatePatterns(content: string) {
    const patterns = [
      {
        pattern: 'jest.mock',
        regex: /jest\.mock\(/g,
        canOptimize: true,
        description: 'Manual jest.mock calls can be replaced with MockFactory'
      },
      {
        pattern: 'beforeEach setup',
        regex: /beforeEach\(\(\) => \{[\s\S]*jest\.clearAllMocks/g,
        canOptimize: true,
        description: 'Standard beforeEach setup can use TestSetupUtils'
      },
      {
        pattern: 'render with providers',
        regex: /render\([^)]+\)/g,
        canOptimize: true,
        description: 'Standard render calls can use ComponentTestUtils.renderWithProviders'
      },
      {
        pattern: 'Lucide icon mocks',
        regex: /\{\s*className[^}]+testid[^}]+\}/g,
        canOptimize: true,
        description: 'Icon mocks can use MockFactory.createLucideIconMocks'
      },
      {
        pattern: 'Form field testing',
        regex: /fireEvent\.change.*target.*value/g,
        canOptimize: true,
        description: 'Form interactions can use ComponentTestUtils.fillFormField'
      },
      {
        pattern: 'Toast expectations',
        regex: /expect.*getByText.*toBeInTheDocument/g,
        canOptimize: true,
        description: 'Toast checks can use ComponentTestUtils.expectToastMessage'
      },
      {
        pattern: 'Modal expectations',
        regex: /expect.*getByRole\('dialog'\)/g,
        canOptimize: true,
        description: 'Modal checks can use ComponentTestUtils.expectModalDialog'
      },
      {
        pattern: 'Table structure testing',
        regex: /expect.*getByRole\('table'\)/g,
        canOptimize: true,
        description: 'Table tests can use ComponentTestUtils.expectTherapeuticTable'
      }
    ];

    return patterns.map(({ pattern, regex, canOptimize, description }) => {
      const matches = content.match(regex) || [];
      return {
        pattern,
        occurrences: matches.length,
        canOptimize: canOptimize && matches.length > 0,
        description,
      };
    });
  }

  /**
   * Analyze mock setup complexity
   */
  private static analyzeMockComplexity(content: string): number {
    let complexity = 0;
    
    // Count manual mocks
    const mockCalls = content.match(/jest\.mock\(/g) || [];
    complexity += mockCalls.length * 2;

    // Count manual icon mocks
    const iconMocks = content.match(/\(\{ className[^}]+props[^}]+\}/g) || [];
    complexity += iconMocks.length * 1;

    // Count beforeEach/afterEach setups
    const setupCalls = content.match(/(beforeEach|afterEach)\(/g) || [];
    complexity += setupCalls.length * 1;

    return complexity;
  }

  /**
   * Detect performance issues in tests
   */
  private static detectPerformanceIssues(content: string): string[] {
    const issues: string[] = [];

    // Check for synchronous operations that could be async
    if (content.includes('fireEvent') && !content.includes('waitFor')) {
      issues.push('Using fireEvent without waitFor - may cause race conditions');
    }

    // Check for missing performance measurements
    if (content.includes('render(') && !content.includes('performance')) {
      issues.push('No performance monitoring for render operations');
    }

    // Check for potential memory leaks
    if (content.includes('setInterval') && !content.includes('clearInterval')) {
      issues.push('Potential memory leak - timers not cleaned up');
    }

    // Check for large test suites without proper organization
    const describes = content.match(/describe\(/g) || [];
    const its = content.match(/it\(/g) || [];
    if (its.length > 20 && describes.length < 3) {
      issues.push('Large test suite with poor organization');
    }

    return issues;
  }

  /**
   * Calculate optimization potential percentage
   */
  private static calculateOptimizationPotential(analysis: TestFileAnalysis): number {
    let potential = 0;

    // Mock complexity reduction potential
    potential += Math.min(analysis.mockSetupComplexity * 2, 30);

    // Duplicate pattern reduction potential
    const optimizablePatterns = analysis.duplicatePatterns.filter(p => p.canOptimize);
    potential += optimizablePatterns.length * 5;

    // Performance improvement potential
    potential += analysis.performanceIssues.length * 10;

    // Code reduction potential based on file size
    if (analysis.linesOfCode > 500) potential += 20;
    if (analysis.linesOfCode > 300) potential += 10;

    return Math.min(potential, 90); // Cap at 90%
  }

  /**
   * Generate refactoring suggestions for a test file
   */
  static generateRefactoringSuggestions(analysis: TestFileAnalysis): string[] {
    const suggestions: string[] = [];

    // Mock optimization suggestions
    if (analysis.mockSetupComplexity > 10) {
      suggestions.push(
        `Replace ${analysis.mockSetupComplexity} manual mock setups with TestSetupUtils.setupWithMocks()`
      );
    }

    // Pattern-specific suggestions
    analysis.duplicatePatterns.forEach(pattern => {
      if (pattern.canOptimize && pattern.occurrences > 2) {
        suggestions.push(
          `Replace ${pattern.occurrences} instances of '${pattern.pattern}' with utility functions`
        );
      }
    });

    // Performance suggestions
    analysis.performanceIssues.forEach(issue => {
      suggestions.push(`Performance: ${issue}`);
    });

    // Organization suggestions
    if (analysis.linesOfCode > 400) {
      suggestions.push(
        `Consider splitting this ${analysis.linesOfCode}-line test file using ComponentTestTemplate`
      );
    }

    return suggestions;
  }

  /**
   * Analyze all test files in the project
   */
  static analyzeAllTests(testDir = '__tests__'): TestFileAnalysis[] {
    const testFiles = this.findTestFiles(testDir);
    return testFiles.map(file => this.analyzeTestFile(file));
  }

  /**
   * Find all test files recursively
   */
  private static findTestFiles(dir: string): string[] {
    const testFiles: string[] = [];
    
    const walkDir = (currentDir: string) => {
      const files = fs.readdirSync(currentDir);
      
      files.forEach(file => {
        const fullPath = path.join(currentDir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !file.startsWith('.')) {
          walkDir(fullPath);
        } else if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) {
          testFiles.push(fullPath);
        }
      });
    };

    walkDir(dir);
    return testFiles;
  }

  /**
   * Generate comprehensive optimization report
   */
  static generateOptimizationReport(): string {
    const analyses = this.analyzeAllTests();
    
    const totalTests = analyses.length;
    const totalLOC = analyses.reduce((sum, a) => sum + a.linesOfCode, 0);
    const avgOptimizationPotential = analyses.reduce((sum, a) => sum + a.optimizationPotential, 0) / totalTests;
    
    const highOptimizationFiles = analyses
      .filter(a => a.optimizationPotential > 50)
      .sort((a, b) => b.optimizationPotential - a.optimizationPotential);

    const report = `
# Test Architecture Optimization Report

## Summary
- **Total test files analyzed**: ${totalTests}
- **Total lines of code**: ${totalLOC.toLocaleString()}
- **Average optimization potential**: ${avgOptimizationPotential.toFixed(1)}%
- **Files with high optimization potential**: ${highOptimizationFiles.length}

## Top Files for Optimization

${highOptimizationFiles.slice(0, 10).map(file => `
### ${path.basename(file.filePath)} (${file.optimizationPotential}% potential)
- **Lines of code**: ${file.linesOfCode}
- **Mock complexity**: ${file.mockSetupComplexity}
- **Performance issues**: ${file.performanceIssues.length}

**Optimization opportunities**:
${this.generateRefactoringSuggestions(file).map(s => `- ${s}`).join('\n')}

**Duplicate patterns found**:
${file.duplicatePatterns
  .filter(p => p.canOptimize && p.occurrences > 0)
  .map(p => `- ${p.pattern}: ${p.occurrences} occurrences`)
  .join('\n')}
`).join('\n')}

## Overall Patterns Analysis

${this.generatePatternSummary(analyses)}

## Recommendations

1. **Immediate actions** (high impact, low effort):
   - Replace manual mock setups with \`TestSetupUtils.setupWithMocks()\`
   - Use \`ComponentTestUtils.renderWithProviders()\` for all React testing
   - Implement \`MockFactory\` patterns for consistent mocking

2. **Medium-term improvements**:
   - Refactor large test files using \`ComponentTestTemplate\`
   - Add performance monitoring with \`PerformanceTestUtils\`
   - Implement therapeutic-specific testing utilities

3. **Long-term optimizations**:
   - Parallel test execution optimization
   - Test data generation standardization
   - Comprehensive test coverage analysis

## Estimated Benefits

- **Code reduction**: ${Math.round(totalLOC * 0.3).toLocaleString()} lines (~30%)
- **Test execution speed**: 30-50% improvement
- **Maintenance effort**: 60% reduction
- **Developer onboarding**: 70% faster test writing
`;

    return report;
  }

  /**
   * Generate pattern summary across all files
   */
  private static generatePatternSummary(analyses: TestFileAnalysis[]): string {
    const patternSummary = new Map<string, { total: number; canOptimize: number }>();

    analyses.forEach(analysis => {
      analysis.duplicatePatterns.forEach(pattern => {
        const existing = patternSummary.get(pattern.pattern) || { total: 0, canOptimize: 0 };
        existing.total += pattern.occurrences;
        if (pattern.canOptimize) existing.canOptimize += pattern.occurrences;
        patternSummary.set(pattern.pattern, existing);
      });
    });

    let summary = 'Pattern | Total Occurrences | Optimizable\n';
    summary += '--------|-------------------|------------\n';
    
    Array.from(patternSummary.entries())
      .sort(([,a], [,b]) => b.total - a.total)
      .forEach(([pattern, data]) => {
        summary += `${pattern} | ${data.total} | ${data.canOptimize}\n`;
      });

    return summary;
  }
}

// =============================================================================
// MIGRATION UTILITIES
// =============================================================================

export class TestMigrationHelper {
  
  /**
   * Generate migration script for a specific test file
   */
  static generateMigrationScript(filePath: string): string {
    const analysis = TestRefactorHelper.analyzeTestFile(filePath);
    const suggestions = TestRefactorHelper.generateRefactoringSuggestions(analysis);

    return `
// Migration script for ${path.basename(filePath)}
// Generated automatically based on optimization analysis

/*
OPTIMIZATION POTENTIAL: ${analysis.optimizationPotential}%

CURRENT ISSUES:
${suggestions.map(s => `- ${s}`).join('\n')}

MIGRATION STEPS:
1. Add import: import { ComponentTestUtils, TestSetupUtils } from '../utils/test-utilities';
2. Replace manual mocks with TestSetupUtils.setupWithMocks()
3. Replace render() calls with ComponentTestUtils.renderWithProviders()
4. Replace manual assertions with utility methods
5. Add performance monitoring with PerformanceTestUtils

ESTIMATED BENEFITS:
- Lines of code reduction: ${Math.round(analysis.linesOfCode * 0.3)} lines
- Mock setup simplification: ${analysis.mockSetupComplexity} complexity points
- Performance improvements: ${analysis.performanceIssues.length} issues addressed
*/

// Example refactored imports:
import { ComponentTestUtils, TestSetupUtils, ComponentTestTemplate } from '../utils/test-utilities';

// Example refactored setup:
TestSetupUtils.setupWithMocks({
  utils: true,
  lucide: true,
  database: true,
});

// Example refactored test structure:
ComponentTestTemplate.createTestSuite(
  'ComponentName',
  ComponentToTest,
  defaultProps,
  customTests
);
`;
  }

  /**
   * Batch generate migration scripts for all high-priority files
   */
  static generateBatchMigrationScripts(): void {
    const analyses = TestRefactorHelper.analyzeAllTests();
    const highPriorityFiles = analyses
      .filter(a => a.optimizationPotential > 40)
      .sort((a, b) => b.optimizationPotential - a.optimizationPotential);

    highPriorityFiles.forEach(analysis => {
      const script = this.generateMigrationScript(analysis.filePath);
      const scriptPath = analysis.filePath.replace('.test.', '.migration.');
      
      fs.writeFileSync(scriptPath, script);
      console.log(`Generated migration script: ${scriptPath}`);
    });

    console.log(`Generated ${highPriorityFiles.length} migration scripts`);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  TestRefactorHelper,
  TestMigrationHelper,
};

// CLI usage example
if (require.main === module) {
  console.log('Generating Test Optimization Report...');
  const report = TestRefactorHelper.generateOptimizationReport();
  console.log(report);
  
  // Optionally generate migration scripts
  if (process.argv.includes('--generate-scripts')) {
    TestMigrationHelper.generateBatchMigrationScripts();
  }
}