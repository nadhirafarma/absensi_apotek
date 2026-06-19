/*
  Google Apps Script final - Slip gaji otomatis Apotek Nadhira Farma.

  Paste seluruh isi file ini ke file slip_gaji_bulanan.gs di Apps Script.

  Fungsi yang dipilih dari dropdown Apps Script:
  1. cekStatusSlipGaji()
     Cek NIP, kontak email/WhatsApp, token provider, dan trigger.

  2. testKirimSlipGajiKeYolan()
     Test kirim slip NIP yang sedang dipilih di Slip_Gaji!E7 ke:
     - Email: yolanalfarel@gmail.com
     - WhatsApp: 08128247474

  3. testKirimSemuaSlipKeYolan()
     Test/kirim semua PDF slip karyawan dalam satu email ke Yolan.

  4. kirimSlipGajiSekarang()
     Kirim semua slip periode bulan lalu sekarang.

  5. setupSlipGajiOtomatis()
     Pasang trigger setiap tanggal 1 jam 08.00 WIB.
     Jika dijalankan pada tanggal 1, langsung mengirim satu email berisi semua slip ke Yolan.

  6. runMonthlySalarySlipAutomation()
     Fungsi untuk trigger otomatis. Jangan dipilih manual kecuali perlu test.

  Script Properties yang dipakai:
  - SLIP_EMAIL_ENABLED=true
  - SLIP_WA_ENABLED=true
  - SLIP_SHARE_PDF_LINK=true
  - WA_PROVIDER=fonnte atau wablas atau generic
  - FONNTE_TOKEN=token_fonnte
  - WABLAS_TOKEN=token_wablas
  - WABLAS_SECRET_KEY=secret_key_wablas
  - WABLAS_DOMAIN=https://domain-wablas
*/

var SlipGajiBulanan = (function() {
  var CONFIG = {
    spreadsheetId: '1L_MfAj7UOa9Ngb6VEY6G4PiMBbwOIAu3De_puVYvNw4',
    templateSheetName: 'Slip_Gaji',
    contactSheetName: 'data_karyawan',
    nipCell: 'E7',
    nameCell: 'E8',
    periodCells: ['K6', 'K7', 'J6', 'J7'],
    exportRange: 'C1:K22',
    folderName: 'slip_gaji_pdf',
    logSheetName: 'log_slip_gaji',
    timezone: 'Asia/Jakarta',
    sendHour: 8,
    renderDelayMs: 1200,
    testEmail: 'yolanalfarel@gmail.com',
    testWhatsapp: '08128247474'
  };

  var MONTHS_ID = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember'
  ];

  function setup() {
    var props = PropertiesService.getScriptProperties();

    props.setProperties({
      SLIP_EMAIL_ENABLED: 'true',
      SLIP_WA_ENABLED: 'true',
      SLIP_SHARE_PDF_LINK: 'true',
      WA_PROVIDER: props.getProperty('WA_PROVIDER') || 'fonnte'
    }, false);

    deleteTriggers();

    ScriptApp.newTrigger('runMonthlySalarySlipAutomation')
      .timeBased()
      .inTimezone(CONFIG.timezone)
      .onMonthDay(1)
      .atHour(CONFIG.sendHour)
      .create();

    var result = {
      ok: true,
      message: 'Trigger aktif setiap tanggal 1 jam ' + CONFIG.sendHour + '.00 WIB.',
      catchUp: null
    };

    if (isTodayMonthDayOne()) {
      result.catchUp = sendAllToYolan();
    }

    return result;
  }

  function sendNow() {
    var period = previousMonthPeriod();

    return sendSalarySlips({
      period: period
    });
  }

  function sendTestToYolan() {
    var period = previousMonthPeriod();

    return sendSalarySlips({
      period: period,
      onlyCurrentNip: true,
      forceEmail: CONFIG.testEmail,
      forceWhatsapp: normalizePhone(CONFIG.testWhatsapp),
      forceWhatsappEnabled: true
    });
  }

  function sendAllToYolan() {
    var period = previousMonthPeriod();

    return sendSalarySlipsAsOneEmail({
      period: period,
      email: CONFIG.testEmail,
      whatsapp: normalizePhone(CONFIG.testWhatsapp)
    });
  }

  function status() {
    var config = readConfig();
    var spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
    var templateSheet = spreadsheet.getSheetByName(config.templateSheetName);

    if (!templateSheet) {
      throw new Error('Sheet "' + config.templateSheetName + '" tidak ditemukan.');
    }

    var currentNip = templateSheet.getRange(config.nipCell).getDisplayValue();
    var currentName = templateSheet.getRange(config.nameCell).getDisplayValue();
    var contacts = readContacts(spreadsheet, config);
    var nips = readNips(templateSheet, contacts, config);
    var contact = findContact(contacts, currentNip, currentName);
    var triggers = ScriptApp.getProjectTriggers().map(function(trigger) {
      return {
        handler: trigger.getHandlerFunction(),
        eventType: String(trigger.getEventType ? trigger.getEventType() : '')
      };
    });
    var monthlyTriggers = triggers.filter(function(trigger) {
      return trigger.handler === 'runMonthlySalarySlipAutomation';
    });

    return {
      ok: true,
      period: previousMonthPeriod().label,
      nipsTotal: nips.length,
      firstNips: nips.slice(0, 10),
      currentSlip: {
        nip: currentNip,
        name: currentName,
        email: contact.email || '',
        whatsapp: contact.whatsapp || ''
      },
      contactsTotal: Object.keys(contacts.byKey).length,
      triggerCount: monthlyTriggers.length,
      triggers: triggers,
      mailQuotaRemaining: MailApp.getRemainingDailyQuota(),
      config: {
        emailEnabled: config.emailEnabled,
        whatsappEnabled: config.whatsappEnabled,
        whatsappProvider: config.whatsappProvider,
        sharePdfLink: config.sharePdfLink,
        hasFonnteToken: Boolean(config.fonnteToken),
        hasWablasToken: Boolean(config.wablasToken),
        hasWablasSecretKey: Boolean(config.wablasSecretKey),
        hasWablasDomain: Boolean(config.wablasDomain),
        hasGenericUrl: Boolean(config.genericUrl)
      },
      saran: buildStatusSuggestion(config, contact, monthlyTriggers)
    };
  }

  function runMonthly() {
    return sendAllToYolan();
  }

  function sendSalarySlips(options) {
    options = options || {};

    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    var spreadsheet = null;
    var templateSheet = null;
    var originalNip = '';

    try {
      var config = readConfig();
      spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
      templateSheet = spreadsheet.getSheetByName(config.templateSheetName);

      if (!templateSheet) {
        throw new Error('Sheet "' + config.templateSheetName + '" tidak ditemukan.');
      }

      originalNip = templateSheet.getRange(config.nipCell).getDisplayValue();

      var contacts = readContacts(spreadsheet, config);
      var nips = options.onlyCurrentNip ? [originalNip] : readNips(templateSheet, contacts, config);
      var folder = getOrCreateFolder(config.folderName);
      var period = options.period || previousMonthPeriod();
      var results = [];

      if (!nips.length) {
        throw new Error('Daftar NIP kosong. Pastikan dropdown ' + config.nipCell + ' berisi NIP.');
      }

      nips.forEach(function(nip) {
        var cleanNip = String(nip || '').trim();

        if (!cleanNip) return;

        try {
          results.push(processOneSlip(spreadsheet, templateSheet, folder, contacts, cleanNip, period, config, options));
        } catch (error) {
          results.push({
            ok: false,
            nip: cleanNip,
            error: String(error && error.message ? error.message : error)
          });
        }
      });

      return summarizeResults(results);
    } finally {
      if (templateSheet && originalNip) {
        templateSheet.getRange(readConfig().nipCell).setValue(originalNip);
        SpreadsheetApp.flush();
      }

      lock.releaseLock();
    }
  }

  function sendSalarySlipsAsOneEmail(options) {
    options = options || {};

    var lock = LockService.getScriptLock();
    lock.waitLock(30000);

    var spreadsheet = null;
    var templateSheet = null;
    var originalNip = '';

    try {
      var config = readConfig();
      spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
      templateSheet = spreadsheet.getSheetByName(config.templateSheetName);

      if (!templateSheet) {
        throw new Error('Sheet "' + config.templateSheetName + '" tidak ditemukan.');
      }

      originalNip = templateSheet.getRange(config.nipCell).getDisplayValue();

      var contacts = readContacts(spreadsheet, config);
      var nips = readNips(templateSheet, contacts, config);
      var folder = getOrCreateFolder(config.folderName);
      var period = options.period || previousMonthPeriod();
      var files = [];
      var results = [];

      if (!nips.length) {
        throw new Error('Daftar NIP kosong. Pastikan dropdown ' + config.nipCell + ' berisi NIP.');
      }

      nips.forEach(function(nip) {
        var cleanNip = String(nip || '').trim();

        if (!cleanNip) return;

        try {
          var item = createOneSlipFile(spreadsheet, templateSheet, folder, contacts, cleanNip, period, config);

          files.push(item.file);
          results.push({
            ok: true,
            nip: item.nip,
            name: item.name,
            file: item.file.getUrl()
          });
        } catch (error) {
          results.push({
            ok: false,
            nip: cleanNip,
            error: String(error && error.message ? error.message : error)
          });
        }
      });

      if (!files.length) {
        return {
          ok: false,
          sentEmail: 0,
          total: results.length,
          message: 'Tidak ada PDF slip yang berhasil dibuat.',
          results: results
        };
      }

      var attachments = files.map(function(file) {
        return file.getBlob();
      });
      var fileLinks = files.map(function(file, index) {
        return (index + 1) + '. ' + file.getName() + '\n' + file.getUrl();
      }).join('\n\n');
      var targetEmail = String(options.email || CONFIG.testEmail || '').trim();
      var targetWhatsapp = normalizePhone(options.whatsapp || CONFIG.testWhatsapp || '');
      var emailResult = sendCombinedEmail(targetEmail, attachments, fileLinks, period);
      var whatsappResult = sendCombinedWhatsapp(targetWhatsapp, fileLinks, period, config);

      writeCombinedLog(spreadsheet, config, {
        period: period.label,
        email: targetEmail,
        whatsapp: targetWhatsapp,
        files: files,
        emailResult: emailResult,
        whatsappResult: whatsappResult
      });

      return {
        ok: Boolean(emailResult.ok || whatsappResult.ok),
        total: results.length,
        files: files.length,
        sentEmail: emailResult.ok ? 1 : 0,
        sentWhatsapp: whatsappResult.ok ? 1 : 0,
        email: emailResult,
        whatsapp: whatsappResult,
        results: results
      };
    } finally {
      if (templateSheet && originalNip) {
        templateSheet.getRange(readConfig().nipCell).setValue(originalNip);
        SpreadsheetApp.flush();
      }

      lock.releaseLock();
    }
  }

  function processOneSlip(spreadsheet, templateSheet, folder, contacts, nip, period, config, options) {
    var slip = createOneSlipFile(spreadsheet, templateSheet, folder, contacts, nip, period, config);
    var contact = slip.contact;
    var name = slip.name;
    var pdfFile = slip.file;
    var email = String(options.forceEmail || contact.email || '').trim();
    var whatsapp = normalizePhone(options.forceWhatsapp || contact.whatsapp || '');

    var emailResult = sendEmail(email, pdfFile, name, period, config);
    var whatsappResult = sendWhatsapp(whatsapp, pdfFile, name, period, config, options);

    writeLog(spreadsheet, config, {
      period: period.label,
      nip: nip,
      name: name,
      email: email,
      whatsapp: whatsapp,
      fileName: pdfFile.getName(),
      fileUrl: pdfFile.getUrl(),
      emailResult: emailResult,
      whatsappResult: whatsappResult
    });

    return {
      ok: Boolean(emailResult.ok || whatsappResult.ok),
      nip: nip,
      name: name,
      period: period.label,
      file: pdfFile.getUrl(),
      email: emailResult,
      whatsapp: whatsappResult
    };
  }

  function createOneSlipFile(spreadsheet, templateSheet, folder, contacts, nip, period, config) {
    templateSheet.getRange(config.nipCell).setValue(nip);
    SpreadsheetApp.flush();
    Utilities.sleep(config.renderDelayMs);

    var nameFromSheet = templateSheet.getRange(config.nameCell).getDisplayValue();
    var contact = findContact(contacts, nip, nameFromSheet);
    var name = String(nameFromSheet || contact.name || nip).trim();
    var pdfFile = exportPdf(spreadsheet, templateSheet, folder, nip, name, period, config);

    return {
      nip: nip,
      name: name,
      contact: contact,
      file: pdfFile
    };
  }

  function readConfig() {
    var props = PropertiesService.getScriptProperties();
    var periodCells = parseCsv(props.getProperty('SLIP_PERIOD_CELLS'));

    return {
      spreadsheetId: String(props.getProperty('SLIP_SPREADSHEET_ID') || CONFIG.spreadsheetId).trim(),
      templateSheetName: String(props.getProperty('SLIP_TEMPLATE_SHEET_NAME') || CONFIG.templateSheetName).trim(),
      contactSheetName: String(props.getProperty('SLIP_CONTACT_SHEET_NAME') || CONFIG.contactSheetName).trim(),
      nipCell: String(props.getProperty('SLIP_NIP_CELL') || CONFIG.nipCell).trim(),
      nameCell: String(props.getProperty('SLIP_NAME_CELL') || CONFIG.nameCell).trim(),
      periodCells: periodCells.length ? periodCells : CONFIG.periodCells,
      exportRange: String(props.getProperty('SLIP_EXPORT_RANGE') || CONFIG.exportRange).trim(),
      folderName: String(props.getProperty('SLIP_FOLDER_NAME') || CONFIG.folderName).trim(),
      folderId: String(props.getProperty('SLIP_FOLDER_ID') || '').trim(),
      logSheetName: String(props.getProperty('SLIP_LOG_SHEET_NAME') || CONFIG.logSheetName).trim(),
      nipList: parseCsv(props.getProperty('SLIP_NIP_LIST')),
      nipSourceRange: String(props.getProperty('SLIP_NIP_SOURCE_RANGE') || '').trim(),
      renderDelayMs: Number(props.getProperty('SLIP_RENDER_DELAY_MS') || CONFIG.renderDelayMs),
      emailEnabled: String(props.getProperty('SLIP_EMAIL_ENABLED') || 'true').toLowerCase() !== 'false',
      whatsappEnabled: String(props.getProperty('SLIP_WA_ENABLED') || 'true').toLowerCase() === 'true',
      sharePdfLink: String(props.getProperty('SLIP_SHARE_PDF_LINK') || 'true').toLowerCase() === 'true',
      whatsappProvider: String(props.getProperty('WA_PROVIDER') || 'fonnte').trim().toLowerCase(),
      fonnteToken: String(props.getProperty('FONNTE_TOKEN') || '').trim(),
      wablasToken: String(props.getProperty('WABLAS_TOKEN') || '').trim(),
      wablasSecretKey: String(props.getProperty('WABLAS_SECRET_KEY') || '').trim(),
      wablasDomain: String(props.getProperty('WABLAS_DOMAIN') || '').trim().replace(/\/$/, ''),
      genericUrl: String(props.getProperty('WA_GENERIC_URL') || '').trim(),
      genericToken: String(props.getProperty('WA_GENERIC_TOKEN') || '').trim()
    };
  }

  function readNips(templateSheet, contacts, config) {
    if (config.nipList.length) {
      return uniqueList(config.nipList);
    }

    if (config.nipSourceRange) {
      return uniqueList(readRangeValues(templateSheet.getParent(), config.nipSourceRange));
    }

    var validationNips = readNipsFromValidation(templateSheet.getRange(config.nipCell));

    if (validationNips.length) {
      return uniqueList(validationNips);
    }

    return uniqueList(Object.keys(contacts.byNip));
  }

  function readNipsFromValidation(range) {
    var rule = range.getDataValidation();

    if (!rule) return [];

    var type = rule.getCriteriaType();
    var values = rule.getCriteriaValues();

    if (type === SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) {
      return values[0] || [];
    }

    if (type === SpreadsheetApp.DataValidationCriteria.VALUE_IN_RANGE && values[0]) {
      return flatten(values[0].getDisplayValues());
    }

    return [];
  }

  function readRangeValues(spreadsheet, text) {
    var parts = String(text || '').split('!');
    var sheetName = parts.length > 1 ? parts[0] : CONFIG.contactSheetName;
    var rangeA1 = parts.length > 1 ? parts[1] : parts[0];
    var sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet || !rangeA1) return [];

    return flatten(sheet.getRange(rangeA1).getDisplayValues());
  }

  function readContacts(spreadsheet, config) {
    var sheet = spreadsheet.getSheetByName(config.contactSheetName);
    var contacts = {
      byKey: {},
      byNip: {}
    };

    if (!sheet) return contacts;

    readRowsAsObjects(sheet).forEach(function(row) {
      var nip = pick(row, ['nip', 'idkaryawan', 'idpegawai', 'kode', 'nik']);
      var name = pick(row, ['nama', 'namakaryawan', 'namapegawai', 'karyawan', 'pegawai', 'name']);
      var email = pick(row, ['email', 'alamatemail', 'emailkaryawan', 'emailpegawai', 'gmail', 'mail']);
      var whatsapp = pick(row, [
        'whatsapp',
        'wa',
        'nowa',
        'nowhatsapp',
        'nomorwa',
        'nomorwhatsapp',
        'nohp',
        'nomorhp',
        'nohandphone',
        'handphone',
        'telepon',
        'phone',
        'hp'
      ]);
      var contact = {
        nip: String(nip || '').trim(),
        name: String(name || '').trim(),
        email: String(email || '').trim(),
        whatsapp: normalizePhone(whatsapp)
      };

      if (contact.nip) {
        contacts.byNip[normalizeKey(contact.nip)] = contact;
        contacts.byKey[normalizeKey(contact.nip)] = contact;
      }

      if (contact.name) {
        contacts.byKey[normalizeKey(contact.name)] = contact;
      }
    });

    return contacts;
  }

  function findContact(contacts, nip, name) {
    return contacts.byKey[normalizeKey(nip)] || contacts.byKey[normalizeKey(name)] || {};
  }

  function readRowsAsObjects(sheet) {
    var values = sheet.getDataRange().getDisplayValues();

    if (values.length < 2) return [];

    var headerRowIndex = findHeaderRow(values);
    var headers = values[headerRowIndex].map(normalizeKey);

    return values.slice(headerRowIndex + 1).map(function(row) {
      var obj = {};

      headers.forEach(function(header, index) {
        obj[header || ('kolom' + (index + 1))] = row[index];
      });

      return obj;
    }).filter(function(row) {
      return Object.keys(row).some(function(key) {
        return row[key] !== '' && row[key] != null;
      });
    });
  }

  function findHeaderRow(values) {
    for (var i = 0; i < Math.min(values.length, 5); i += 1) {
      var joined = values[i].map(normalizeKey).join('|');

      if (joined.indexOf('nip') >= 0 || joined.indexOf('nama') >= 0 || joined.indexOf('email') >= 0) {
        return i;
      }
    }

    return 0;
  }

  function exportPdf(spreadsheet, templateSheet, folder, nip, name, period, config) {
    var url = 'https://docs.google.com/spreadsheets/d/' + spreadsheet.getId() + '/export'
      + '?format=pdf'
      + '&gid=' + templateSheet.getSheetId()
      + '&range=' + encodeURIComponent(config.exportRange)
      + '&size=A4'
      + '&portrait=true'
      + '&fitw=true'
      + '&sheetnames=false'
      + '&printtitle=false'
      + '&pagenumbers=false'
      + '&gridlines=false'
      + '&fzr=false'
      + '&horizontal_alignment=CENTER'
      + '&vertical_alignment=TOP'
      + '&top_margin=0.25'
      + '&bottom_margin=0.25'
      + '&left_margin=0.25'
      + '&right_margin=0.25';
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() >= 400) {
      throw new Error('Export PDF gagal untuk NIP ' + nip + ': ' + response.getContentText());
    }

    var fileName = 'Slip_Gaji_' + safeFileName(name || nip) + '_' + period.fileStamp + '.pdf';
    var file = folder.createFile(response.getBlob().setName(fileName));

    if (config.sharePdfLink) {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }

    return file;
  }

  function sendEmail(email, file, name, period, config) {
    if (!config.emailEnabled) {
      return {
        ok: false,
        skipped: true,
        message: 'Email dinonaktifkan.'
      };
    }

    if (!email) {
      return {
        ok: false,
        skipped: true,
        message: 'Email karyawan kosong atau kolom email tidak terbaca.'
      };
    }

    MailApp.sendEmail({
      to: email,
      subject: 'Slip Gaji ' + period.label + ' - Apotek Nadhira Farma',
      body: [
        'Assalamualaikum ' + name + ',',
        '',
        'Terlampir slip gaji periode ' + period.label + '.',
        '',
        'Terima kasih.',
        'Apotek Nadhira Farma'
      ].join('\n'),
      attachments: [file.getBlob()]
    });

    return {
      ok: true,
      to: email
    };
  }

  function sendCombinedEmail(email, attachments, fileLinks, period) {
    if (!email) {
      return {
        ok: false,
        skipped: true,
        message: 'Email tujuan kosong.'
      };
    }

    MailApp.sendEmail({
      to: email,
      subject: 'Semua Slip Gaji ' + period.label + ' - Apotek Nadhira Farma',
      body: [
        'Assalamualaikum,',
        '',
        'Terlampir semua slip gaji periode ' + period.label + '.',
        '',
        'Link file:',
        fileLinks,
        '',
        'Terima kasih.',
        'Apotek Nadhira Farma'
      ].join('\n'),
      attachments: attachments
    });

    return {
      ok: true,
      to: email,
      attachments: attachments.length
    };
  }

  function sendWhatsapp(number, file, name, period, config, options) {
    var enabled = options.forceWhatsappEnabled || config.whatsappEnabled;

    if (!enabled) {
      return {
        ok: false,
        skipped: true,
        message: 'WhatsApp dinonaktifkan.'
      };
    }

    if (!number) {
      return {
        ok: false,
        skipped: true,
        message: 'Nomor WhatsApp kosong atau kolom WA tidak terbaca.'
      };
    }

    var message = [
      'Assalamualaikum ' + name + ',',
      '',
      'Slip gaji periode ' + period.label + ' sudah dibuat.',
      config.sharePdfLink ? 'PDF: ' + file.getUrl() : 'PDF dikirim melalui email.',
      '',
      'Pesan ini dikirim otomatis oleh sistem Apotek Nadhira Farma.'
    ].join('\n');

    if (config.whatsappProvider === 'fonnte') {
      return sendWhatsappViaFonnte(number, message, config);
    }

    if (config.whatsappProvider === 'wablas') {
      return sendWhatsappViaWablas(number, message, config);
    }

    if (config.whatsappProvider === 'generic') {
      return sendWhatsappViaGeneric(number, message, config);
    }

    return {
      ok: false,
      skipped: true,
      message: 'WA_PROVIDER tidak dikenal: ' + config.whatsappProvider
    };
  }

  function sendCombinedWhatsapp(number, fileLinks, period, config) {
    if (!config.whatsappEnabled) {
      return {
        ok: false,
        skipped: true,
        message: 'WhatsApp dinonaktifkan.'
      };
    }

    if (!number) {
      return {
        ok: false,
        skipped: true,
        message: 'Nomor WhatsApp tujuan kosong.'
      };
    }

    var message = [
      'Slip gaji periode ' + period.label + ' sudah dibuat.',
      '',
      fileLinks,
      '',
      'Pesan ini dikirim otomatis oleh sistem Apotek Nadhira Farma.'
    ].join('\n');

    if (config.whatsappProvider === 'fonnte') {
      return sendWhatsappViaFonnte(number, message, config);
    }

    if (config.whatsappProvider === 'wablas') {
      return sendWhatsappViaWablas(number, message, config);
    }

    if (config.whatsappProvider === 'generic') {
      return sendWhatsappViaGeneric(number, message, config);
    }

    return {
      ok: false,
      skipped: true,
      message: 'WA_PROVIDER tidak dikenal: ' + config.whatsappProvider
    };
  }

  function sendWhatsappViaFonnte(number, message, config) {
    if (!config.fonnteToken) {
      return {
        ok: false,
        skipped: true,
        message: 'FONNTE_TOKEN belum diisi di Script Properties.'
      };
    }

    var response = UrlFetchApp.fetch('https://api.fonnte.com/send', {
      method: 'post',
      headers: {
        Authorization: config.fonnteToken
      },
      payload: {
        target: number,
        message: message,
        countryCode: '62'
      },
      muteHttpExceptions: true
    });

    return parseProviderResponse('fonnte', response);
  }

  function sendWhatsappViaWablas(number, message, config) {
    if (!config.wablasToken || !config.wablasSecretKey || !config.wablasDomain) {
      return {
        ok: false,
        skipped: true,
        message: 'WABLAS_TOKEN, WABLAS_SECRET_KEY, atau WABLAS_DOMAIN belum lengkap.'
      };
    }

    var response = UrlFetchApp.fetch(config.wablasDomain + '/api/send-message', {
      method: 'post',
      headers: {
        Authorization: config.wablasToken + '.' + config.wablasSecretKey
      },
      payload: {
        phone: number,
        message: message
      },
      muteHttpExceptions: true
    });

    return parseProviderResponse('wablas', response);
  }

  function sendWhatsappViaGeneric(number, message, config) {
    if (!config.genericUrl) {
      return {
        ok: false,
        skipped: true,
        message: 'WA_GENERIC_URL belum diisi.'
      };
    }

    var headers = {
      'Content-Type': 'application/json'
    };

    if (config.genericToken) {
      headers.Authorization = config.genericToken;
    }

    var response = UrlFetchApp.fetch(config.genericUrl, {
      method: 'post',
      headers: headers,
      payload: JSON.stringify({
        number: number,
        message: message
      }),
      muteHttpExceptions: true
    });

    return parseProviderResponse('generic', response);
  }

  function parseProviderResponse(provider, response) {
    var status = response.getResponseCode();
    var body = response.getContentText();
    var parsed = null;
    var ok = status >= 200 && status < 300;

    try {
      parsed = JSON.parse(body);
    } catch (error) {
      parsed = null;
    }

    if (parsed && (parsed.status === false || parsed.success === false || parsed.ok === false)) {
      ok = false;
    }

    return {
      provider: provider,
      ok: ok,
      status: status,
      body: body,
      reason: parsed ? (parsed.reason || parsed.message || parsed.error || '') : ''
    };
  }

  function summarizeResults(results) {
    var sentEmail = results.filter(function(item) {
      return item.email && item.email.ok;
    }).length;
    var sentWhatsapp = results.filter(function(item) {
      return item.whatsapp && item.whatsapp.ok;
    }).length;
    var failed = results.filter(function(item) {
      return item.ok === false;
    }).length;

    return {
      ok: sentEmail > 0 || sentWhatsapp > 0,
      total: results.length,
      sentEmail: sentEmail,
      sentWhatsapp: sentWhatsapp,
      failed: failed,
      message: sentEmail || sentWhatsapp
        ? 'Slip berhasil diproses.'
        : 'Tidak ada slip yang terkirim. Lihat detail results/email/whatsapp untuk penyebabnya.',
      results: results
    };
  }

  function getOrCreateFolder(name) {
    var config = readConfig();

    if (config.folderId) {
      return DriveApp.getFolderById(config.folderId);
    }

    var folders = DriveApp.getFoldersByName(name);

    if (folders.hasNext()) {
      return folders.next();
    }

    return DriveApp.createFolder(name);
  }

  function writeLog(spreadsheet, config, item) {
    var sheet = spreadsheet.getSheetByName(config.logSheetName) || spreadsheet.insertSheet(config.logSheetName);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'Periode',
        'NIP',
        'Nama',
        'Email',
        'WhatsApp',
        'File',
        'Status Email',
        'Status WhatsApp'
      ]);
    }

    sheet.appendRow([
      new Date(),
      item.period,
      item.nip,
      item.name,
      item.email,
      item.whatsapp,
      item.fileName + ' | ' + item.fileUrl,
      JSON.stringify(item.emailResult),
      JSON.stringify(item.whatsappResult)
    ]);
  }

  function writeCombinedLog(spreadsheet, config, item) {
    var sheet = spreadsheet.getSheetByName(config.logSheetName) || spreadsheet.insertSheet(config.logSheetName);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'Periode',
        'NIP',
        'Nama',
        'Email',
        'WhatsApp',
        'File',
        'Status Email',
        'Status WhatsApp'
      ]);
    }

    sheet.appendRow([
      new Date(),
      item.period,
      'SEMUA',
      'Semua Slip Gaji',
      item.email,
      item.whatsapp,
      item.files.map(function(file) {
        return file.getName() + ' | ' + file.getUrl();
      }).join('\n'),
      JSON.stringify(item.emailResult),
      JSON.stringify(item.whatsappResult)
    ]);
  }

  function deleteTriggers() {
    ScriptApp.getProjectTriggers().forEach(function(trigger) {
      var handler = trigger.getHandlerFunction();

      if (handler === 'runMonthlySalarySlipAutomation' || handler === 'kirimSlipGajiKeHRD') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
  }

  function previousMonthPeriod() {
    var now = new Date();
    var start = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    return {
      label: MONTHS_ID[start.getMonth()] + ' ' + start.getFullYear(),
      fileStamp: Utilities.formatDate(start, CONFIG.timezone, 'yyyy-MM')
    };
  }

  function isTodayMonthDayOne() {
    return Utilities.formatDate(new Date(), CONFIG.timezone, 'd') === '1';
  }

  function buildStatusSuggestion(config, contact, triggers) {
    var suggestions = [];

    if (!contact.email) suggestions.push('Email untuk NIP yang sedang dipilih belum terbaca.');
    if (!contact.whatsapp) suggestions.push('Nomor WhatsApp untuk NIP yang sedang dipilih belum terbaca.');
    if (config.whatsappProvider === 'fonnte' && !config.fonnteToken) suggestions.push('FONNTE_TOKEN belum ada di Script Properties.');
    if (config.whatsappProvider === 'wablas' && (!config.wablasToken || !config.wablasSecretKey || !config.wablasDomain)) suggestions.push('Konfigurasi Wablas belum lengkap.');
    if (!triggers.length) suggestions.push('Trigger bulanan belum aktif. Jalankan setupSlipGajiOtomatis().');

    return suggestions.length ? suggestions : ['Konfigurasi dasar terlihat siap. Jalankan testKirimSlipGajiKeYolan().'];
  }

  function parseCsv(value) {
    var raw = String(value || '').trim();

    if (!raw) return [];

    return raw.split(',').map(function(item) {
      return String(item || '').trim();
    }).filter(Boolean);
  }

  function pick(row, keys) {
    for (var i = 0; i < keys.length; i += 1) {
      var key = normalizeKey(keys[i]);

      if (row[key] !== '' && row[key] != null) {
        return row[key];
      }
    }

    return '';
  }

  function uniqueList(values) {
    var seen = {};
    var result = [];

    values.forEach(function(value) {
      var text = String(value || '').trim();
      var key = normalizeKey(text);

      if (!text || seen[key]) return;

      seen[key] = true;
      result.push(text);
    });

    return result;
  }

  function flatten(matrix) {
    return matrix.reduce(function(list, row) {
      return list.concat(row);
    }, []);
  }

  function normalizePhone(value) {
    var raw = String(value || '').replace(/[^0-9]+/g, '');

    if (!raw) return '';
    if (raw.indexOf('0') === 0) return '62' + raw.slice(1);
    if (raw.indexOf('62') === 0) return raw;

    return raw;
  }

  function normalizeKey(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  }

  function safeFileName(value) {
    return String(value || 'karyawan')
      .replace(/[\\/:*?"<>|]+/g, '_')
      .replace(/\s+/g, '_');
  }

  return {
    setup: setup,
    sendNow: sendNow,
    sendTestToYolan: sendTestToYolan,
    sendAllToYolan: sendAllToYolan,
    status: status,
    runMonthly: runMonthly
  };
})();

function setupSlipGajiOtomatis() {
  var result = SlipGajiBulanan.setup();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function kirimSlipGajiSekarang() {
  var result = SlipGajiBulanan.sendNow();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function testKirimSlipGajiKeYolan() {
  var result = SlipGajiBulanan.sendTestToYolan();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function testKirimSemuaSlipKeYolan() {
  var result = SlipGajiBulanan.sendAllToYolan();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function cekStatusSlipGaji() {
  var result = SlipGajiBulanan.status();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function runMonthlySalarySlipAutomation() {
  var result = SlipGajiBulanan.runMonthly();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
