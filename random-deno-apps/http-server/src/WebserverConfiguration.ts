export interface WebserverConfiguration {
  /**
   * Path to look for content.
   */
  path: string;
  /**
   * Watch for filesystem.
   */
  watchFs: boolean;
  /**
   * Whether to assume that if there is no extension provided, the extension
   * should be set to HTML.
   */
  assumeHtmlIfExtensionIsAbsent: boolean;
}
