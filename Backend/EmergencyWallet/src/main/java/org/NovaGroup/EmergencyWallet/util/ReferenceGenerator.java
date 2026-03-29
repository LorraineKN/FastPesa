package org.NovaGroup.EmergencyWallet.util;

import java.util.Random;

public class ReferenceGenerator {

    private static final String CHARS = "0123456789ABCDEF";
    private static final Random random = new Random();

    public static String generateTxReference() {
        StringBuilder id = new StringBuilder("TX-");
        for (int i = 0; i < 10; i++) {
            id.append(CHARS.charAt(random.nextInt(CHARS.length())));
        }
        return id.toString();
    }

    public static String generateConversationId(String prefix) {
        return prefix + "_" + System.currentTimeMillis();
    }
}
