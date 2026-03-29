package org.NovaGroup.EmergencyWallet.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public class TimestampFormatter {

    private static final DateTimeFormatter FORMATTER = 
        DateTimeFormatter.ofPattern("dd/M/yy, h:mm a")
            .withLocale(new Locale("en", "KE"));

    public static String formatTimestamp(LocalDateTime dateTime) {
        return dateTime.format(FORMATTER);
    }

    public static String formatKES(java.math.BigDecimal amount) {
        return "Ksh" + String.format("%,.2f", amount);
    }
}
