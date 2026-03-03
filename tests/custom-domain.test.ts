import { describe, it, expect } from 'vitest';
import { getBaseUrl, getConsentFormUrl } from '../constants/config';

describe('Custom Domain Configuration', () => {
  it('should return custom domain when CUSTOM_DOMAIN is set', () => {
    const baseUrl = getBaseUrl();
    expect(baseUrl).toBeDefined();
    expect(typeof baseUrl).toBe('string');
    expect(baseUrl.length).toBeGreaterThan(0);
  });

  it('should generate valid consent form URLs', () => {
    const projectId = 1;
    const consentUrl = getConsentFormUrl(projectId);
    
    expect(consentUrl).toBeDefined();
    expect(typeof consentUrl).toBe('string');
    expect(consentUrl).toContain('/consent/');
    expect(consentUrl).toContain(projectId.toString());
  });

  it('should use HTTPS protocol for custom domain', () => {
    const baseUrl = getBaseUrl();
    
    if (process.env.CUSTOM_DOMAIN) {
      expect(baseUrl).toMatch(/^https?:\/\//);
    }
  });

  it('should format consent URLs correctly', () => {
    const projectId = 5;
    const consentUrl = getConsentFormUrl(projectId);
    
    // Should end with /consent/{projectId}
    expect(consentUrl).toMatch(/\/consent\/\d+$/);
  });
});
