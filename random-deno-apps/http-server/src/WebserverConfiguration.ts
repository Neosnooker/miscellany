export interface WebserverConfiguration {
  /**
   * Path to look for content.
   *
   * + When the type is `string`, this will be used as the content path.
   * + When the type is `[string, string]`, the first string will be used as
   *  the path to the content and the second string will be used as the route
   *  that the URL path must begin with to serve the content.
   * + When the type is `[string, string][]`, each array element is interpreted
   *  the same as when it is of the type `[string, string]`.
   */
  contentPath: string | [string, string] | [string, string][];
  /**
   * Watch for filesystem.
   *
   * The default value is `true`.
   */
  watchFs: boolean;
  /**
   * Whether to assume that if there is no extension provided, the extension
   * should be set to HTML.
   *
   * The default value is `true`.
   */
  assumeHtmlIfExtensionIsAbsent: boolean;
  /**
   * The name of the files for special pages.
   */
  specialPages: {
    notFoundFilename: string;
  };
  /**
   * The function to call when the server receives a connection.
   */
  requestEventCallback: (requestEvent: Deno.RequestEvent) => void;
}
