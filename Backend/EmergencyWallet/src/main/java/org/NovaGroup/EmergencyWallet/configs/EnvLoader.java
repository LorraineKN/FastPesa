package org.NovaGroup.EmergencyWallet.configs;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.stereotype.Component;

@Component
public class EnvLoader {

    private final Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

    public String get(String key, String defaultValue) {
        return dotenv.get(key, defaultValue);
    }
}