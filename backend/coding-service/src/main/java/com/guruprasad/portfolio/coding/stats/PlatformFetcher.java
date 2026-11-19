package com.guruprasad.portfolio.coding.stats;

import com.fasterxml.jackson.databind.JsonNode;

/** One coding platform's live numbers. Throws when the platform can't be read; the last saved copy is used then. */
public interface PlatformFetcher {

    /** The key in the /api/stats answer, e.g. "leetcode". */
    String id();

    JsonNode fetch() throws Exception;
}
