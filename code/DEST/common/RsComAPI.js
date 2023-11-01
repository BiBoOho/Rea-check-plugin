(function($) {
	"use strict";

	if (window.RsComAPI) {
		var _RsComAPI = window.RsComAPI;
	}

	var RsComAPI = window.RsComAPI = {
		version : "1.0.4",

		regionalDef : {
            'ja': {
                'undefineAppid': 'アプリIDが指定されていません',
                'undefineRecid': 'レコードIDが指定されていません',
                'undefineURI': 'URIが指定されていません',
                'undefineFieldCode': 'フィールドコードが指定されていません',
                'checkAccessRights': 'アクセス権を確認してください'
            }
		},
        regional : {},
        // 表示言語の定義
        registRegional : function(lang, def) {
            window.RsComAPI.regionalDef[lang] = def;
        },
        // 表示言語の設定
        setRegional : function(lang) {
            window.RsComAPI.regional = window.RsComAPI.regionalDef[lang];
        },

		noConflict: function(deep) {
			window._ = __;
			if (deep &&  window.RsComAPI === RsComAPI) window.RsComAPI = _RsComAPI;
			return RsComAPI;
		},
		/*
		   ログ出力
		*/
		infoLog: function() {
			if (typeof window.RsComAPIDebug === 'undefined') return;
			window.RsComAPIDebug.infoLog(Array.apply(null, arguments));
		},
		warningLog: function() {
			if (typeof window.RsComAPIDebug === 'undefined') return;
			window.RsComAPIDebug.warnLog(Array.apply(null, arguments));
		},
		errorLog: function() {
			if (typeof window.RsComAPIDebug === 'undefined') return;
			window.RsComAPIDebug.errorLog(Array.apply(null, arguments));
		},
		debugLog: function() {
			if (typeof window.RsComAPIDebug === 'undefined') return;
			window.RsComAPIDebug.debugLog(Array.apply(null, arguments));
		},
		traceLog: function() {
			if (typeof window.RsComAPIDebug === 'undefined') return;
			window.RsComAPIDebug.traceLog(Array.apply(null, arguments));
		},
		drawTestFill: function() {
			if (typeof window.RsComAPIDebug === 'undefined') return false;
			return window.RsComAPIDebug.drawTestFill();
		},

		/*
		   スピナー表示
		*/
		showSpinner: function() {
			// 要素作成等初期化処理
			if ($('#kinsol_spin_overlay').length == 0) {
				// スピナー設置用要素の作成
				$(document.body).append(
					$('<div>').attr({'id': 'kinsol_spin_overlay'}).append(
						$('<div>').addClass('kinsol_spin_cv_spinner').append(
							$('<span>').addClass('kinsol_spin_spinner'),
							$('<p>').addClass('kinsol_text_spinner').text('')
						)
					)
				);
				// スピナー動作に伴うスタイル設定
				$('#kinsol_spin_overlay').css({
					'position': 'fixed',
					'top': '0',
					'left': '0',
					'z-index': '999',
					'width': '100%',
					'height': '100%',
					'display': 'none',
					'background': 'rgba(0, 0, 0, 0.6)'
				});
				$('.kinsol_spin_cv_spinner').css({
					'height': '100%',
					'display': 'flex',
					'justify-content': 'center',
					'align-items': 'center'
				});
				$('.kinsol_spin_spinner').css({
					'width': '80px',
					'height': '80px',
					'border': '4px #ddd solid',
					'border-top': '4px #999 solid',
					'border-radius': '50%',
					'animation-name': 'kinsol_spin_anime',
					'animation-duration': '0.8s',
					'animation-iteration-count': 'infinite',
					'animation-timing-function': 'linear'
    			});
					$('.kinsol_text_spinner').css({
						'width': '88px',
						'height': '20px',
						'position': 'relative',
						'top': '0px',
						'left': '-88px',
						'color': '#fff',
						'text-align': 'center'
					});
			}
			// スピナー始動（表示）
			RsComAPI.debugLog('スピナー始動');
			$('#kinsol_spin_overlay').fadeIn(0);
		},

		/*
		   スピナー文字設定
		*/
		setSpinnerText: function(txt) {
			$('.kinsol_text_spinner').text(txt);
		},
		/*
		   スピナー停止（非表示）
		*/
		hideSpinner: function() {
			setTimeout(function(){
				RsComAPI.debugLog('スピナー停止');
				$('#kinsol_spin_overlay').fadeOut(500);
			}, 500);
    },

		/*
			レコード読み込み - recordの配列を返却
			parm.app - アプリID
			parm.fields - フィールド配列 ※省略:全て
			parm.query - 取得条件 ※省略:全て
			parm.offset - オフセット ※省略:0
			parm.limit - 取得最大数 ※省略:全て
			parm.token - APIトークン ※省略:通常
		*/
		getRecords: function(parm, callback, errback) {
			function getRec(appid, cond, fields, lmt, ofs, token, callback, errback, data) {
				if (appid === undefined) {
					var err = {};
					err['messages'] = window.RsComAPI.regional['undefineAppid']; // アプリIDが未定指定です
					if (errback) errback(err);
				}
				var limit_num;
				if (lmt === undefined || lmt === null) limit_num = 500;
				else {
					if (data === undefined) limit_num = lmt;
					else limit_num = lmt - data.records.length;
				}
				if (limit_num > 500) limit_num = 500;
				var limit = ' limit ' + limit_num;
				var offset = (ofs === undefined || ofs === null) ? '' : ' offset ' + ofs;
				var query = (cond === undefined || cond === null) ? '' : cond;
				query += limit + offset;
				if (data === undefined) {
					var data = {
						records: []
					};
				}
				var parm = {
					app: appid,
					query: query
				}
				if (fields !== undefined && fields !== null) parm['fields'] = fields;

				if (token === undefined || token === null || token === '') {
					RsComAPI.debugLog('Call kintone.api', parm);

					kintone.api(kintone.api.url('/k/v1/records', true), 'GET', parm, function(resp) {
						RsComAPI.debugLog('use kintone.api resp', resp);

						data.records = data.records.concat(resp.records);
						if ((lmt === undefined || lmt === null) && resp.records.length < limit_num || lmt !== undefined && lmt !== null && data.records.length >= lmt || resp.records <= 0) {
							callback(data.records);
						}
						else {
							if (ofs === undefined || ofs === null) ofs = 0;
							ofs += resp.records.length;
							getRec(appid, cond, fields, lmt, ofs, null, callback, errback, data);
						}
					}, errback);
				}
				else {
					var xhr = new XMLHttpRequest();
					xhr.open('POST', kintone.api.url('/k/v1/records', true));
					xhr.setRequestHeader('X-Cybozu-API-Token', token);
					xhr.setRequestHeader('Content-Type', 'application/json');
					xhr.setRequestHeader('X-HTTP-Method-Override', 'GET');
					xhr.onload = function() {
						if (xhr.status === 200 || xhr.status === 201) {
							var resp = JSON.parse(xhr.responseText);
							data.records = data.records.concat(resp.records);
							if ((lmt === undefined || lmt === null) && resp.records.length < limit_num || lmt !== undefined && lmt !== null && data.records.length >= lmt || resp.records <= 0) {
								callback(data.records);
							}
							else {
								if (ofs === undefined || ofs === null) ofs = 0;
								ofs += resp.records.length;
								getRec(appid, cond, fields, lmt, ofs, token, callback, errback, data);
							}
						}
						else {
							RsComAPI.errorLog(parm, xhr.status, xhr.responseText);
							if (errback) errback(JSON.parse(xhr.responseText));
						}
					}
					xhr.send(JSON.stringify(parm));
				}
			}
			if (callback || errback) {
				return getRec(parm.app, parm.query, parm.fields, parm.limit, parm.offset, parm.token, callback, errback);
			}
			else {														// callbackとerrbackが共に指定されていない場合、Promise呼び出し
				return new kintone.Promise(function(resolve, reject) {
					getRec(parm.app, parm.query, parm.fields, parm.limit, parm.offset, parm.token, function(rec) {
						resolve(rec);
					}, function(err) {
						reject(err);
					});
				});
			}
		},
		/*
			レコード読み込み - recordの配列を返却
			kintone.api(pathOrUrl, method, params, opt_callback, opt_errback)
		*/
		kintoneApi: function(pathOrUrl, method, params, opt_token, opt_callback, opt_errback) {
			var token = opt_token || '';
			if (token === undefined || token === null || token === '') {
				return kintone.api(pathOrUrl, method, params, opt_callback, opt_errback);
			}
			function _kintonApi(url, mode, param, apiToken, callback, errback) {
				var reqMode = mode.toUpperCase();
				var override = '';
				if (reqMode === 'GET') {
					override = reqMode;
					reqMode = 'POST';
				}
				var xhr = new XMLHttpRequest();
				xhr.open(reqMode, url);
				if (apiToken !== '') xhr.setRequestHeader('X-Cybozu-API-Token', apiToken);
				xhr.setRequestHeader('Content-Type', 'application/json');
				if (override !== '') xhr.setRequestHeader('X-HTTP-Method-Override', override);
				xhr.onload = function() {
					RsComAPI.traceLog('*** kintoneApi: ', url, mode, param, apiToken, xhr);
					if (xhr.status === 200 || xhr.status === 201) {
						RsComAPI.traceLog(param, xhr.status, xhr.responseText);
						callback(JSON.parse(xhr.responseText));
					}
					else {
						RsComAPI.errorLog(param, xhr.status, xhr.responseText);
						if (errback) errback(JSON.parse(xhr.responseText));
					}
				}
				xhr.send(JSON.stringify(param));
			}

			if (opt_callback || opt_errback) {
				return _kintonApi(pathOrUrl, method, params, token, opt_callback, opt_errback);
			}
			else {														// callbackとerrbackが共に指定されていない場合、Promise呼び出し
				return new kintone.Promise(function(resolve, reject) {
					_kintonApi(pathOrUrl, method, params, token, function(resp) {
						resolve(resp);
					}, function(err) {
						reject(err);
					});
				});
			}
		},

		// ファイルのダウンロード
		// fileKey: ファイルキー
		// oot_token: API-Token ( null or 省略でなし)
		downloadFile : function(fileKey, opt_bImg, opt_token, opt_callback, opt_errback) {
			var bImg = opt_bImg || false;
			var token = opt_token || '';

			function _downloadFile(fileKey, bImg, token, callback, errback) {
				var url = kintone.api.url('/k/v1/file', true) + '?fileKey=' + fileKey;
				var xhr = new XMLHttpRequest();
				xhr.open('GET', url);
				if (token !== '') xhr.setRequestHeader('X-Cybozu-API-Token', token);
				xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
				xhr.responseType = 'blob';
				xhr.onload = function() {
					if (xhr.status === 200) {
						var blob = new Blob([xhr.response]);
						if (bImg === true) {
							var urlBlob = URL.createObjectURL(blob);
							var img = new Image();
							img.onload = function(e) {
								callback(img);
							}
							img.onerror = function(e) {
//								console.log('*** _downloadFile(err): fileKey = ' + fileKey, e, blob);
								var img2 = new Image();
								img2.onload = function(e) {
									callback(img2);
								}
								img2.onerror = function(e2) {
//									console.log('*** _downloadFile(err2): fileKey = ' + fileKey, e2);
									errback(e);
								}
								img2.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFcAAAAhAQMAAACWfaXzAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURQAAAP///6XZn90AAAAJcEhZcwAADsMAAA7DAcdvqGQAAACESURBVCjPYyAGyP+HgQ8ksyU+/v/fD2MXEsE2fPi/x82Ov+MDiH2gvodBhp3hQQGDxMQj9T3JEscEnoHYffY9yfLHLI4ZwNhtFgeA7IMgtgwbgi3hZnH8A4wNUf8QZg6IfQDEhpj/EWhvsow7yF6Y+38g/PLPAonNiORHZiLDgSBgYAAADIjOzQtuKyIAAAAASUVORK5CYII=';
							}
							img.src = urlBlob;
						}
						else {
							callback(blob);
						}
					}
					else if (xhr.status === 403) {
						if (errback) errback('HTTPS Status = ' + xhr.status + '<br>' + window.RsComAPI.regional['checkAccessRights']); // アクセス権を確認してください
					}
					else {
						if (errback) errback('HTTPS Status = ' + xhr.status);
					}
				}
				xhr.onerror = function(e) {
//		console.log('*** _downloadFile(ERR): xhr = ', xhr, e);
					errback(e);
				}

				xhr.send();
			};

			if (opt_callback || opt_errback) {
				return _downloadFile(fileKey, bImg, token, opt_callback, opt_errback);
			}
			else {
				return new kintone.Promise(function(resolve, reject) {
					_downloadFile(fileKey, bImg, token, function(resp) {
						resolve(resp);
					}, function(err) {
						reject(err);
					});
				});
			}
		},

		// ファイルのアップロード
		// blob: Blobデータ
		// name : ファイル名
		// oot_token: API-Token ( null or 省略でなし)
		uploadBlobData: function(blob, name, opt_token, opt_callback, opt_errback) {
			var token = opt_token || '';

			function _uploadBlobData(blob, name, token, callback, errback) {
				var formData = new FormData();
				formData.append("__REQUEST_TOKEN__", kintone.getRequestToken());
				formData.append("file", blob , name);

				var url = '/k/v1/file.json';
				var xhr = new XMLHttpRequest();
				xhr.open('POST', url, true);
				if (token !== '') xhr.setRequestHeader('X-Cybozu-API-Token', token);
				xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
				xhr.onload = function(event) {
					if (xhr.status == 200) {
						var resp = JSON.parse(xhr.response);
						callback(resp.fileKey);
					}
					errback(xhr.responseText);
				}
				xhr.onerror = function(e) {
					errback(e);
				}
				xhr.send(formData);
			}

			if (opt_callback || opt_errback) {
				return _uploadBlobData(blob, name, token, opt_callback, opt_errback);
			}
			else {
				return new kintone.Promise(function(resolve, reject) {
					_uploadBlobData(blob, name, token, function(resp) {
						resolve(resp);
					}, function(err) {
						reject(err);
					});
				});
			}
		},

		// datas: [{'blob': blobl, 'name': ファイル名}]
		// 復帰値: ファイル数分のfilekey
		uploadBlobDatas: function(datas, opt_token, opt_callback, opt_errback) {
			var token = opt_token || '';

			function _uploadBlobDatas(datas, token, callback, errback, opt_fileKeys, opt_idx) {
				var fileKeys = opt_fileKeys || [];
				var idx = opt_idx || 0;
				if (idx >= datas.length) {
					callback(fileKeys);
					return;
				}
				RsComAPI.uploadBlobData(datas[idx]['blob'], datas[idx]['name'], token).then(function(filekey) {
					fileKeys.push(filekey);
					return _uploadBlobDatas(datas, token, callback, errback, fileKeys, idx + 1);
				}).catch(function(err) {
					errback(err);
				});
			}

			if (opt_callback || opt_errback) {
				return _uploadBlobDatas(datas, token, opt_callback, opt_errback);
			}
			else {
				return new kintone.Promise(function(resolve, reject) {
					_uploadBlobDatas(datas, token, function(resp) {
						resolve(resp);
					}, function(err) {
						reject(err);
					});
				});
			}
		},

		// uri;
		// datas: [{'blob': blobl, 'name': ファイル名}]
		// 復帰値: ファイル数分のfilekey
		// app:
		// recid:
		uploadStorageBlobDatas: function(uri, datas, app, recid, opt_callback, opt_errback) {
			function _uploadStorageBlobDatas(uri, datas, app, recid, callback, errback, opt_fileKeys, opt_idx) {
				var fileKeys = opt_fileKeys || [];
				var idx = opt_idx || 0;
				if (idx >= datas.length) {
					callback(fileKeys);
					return;
				}
				RsComAPI.uploadStorageFile(uri, datas[idx]['blob'], datas[idx]['name'], app, '', recid).then(function(filekey) {
					fileKeys.push(filekey);
					return _uploadStorageBlobDatas(uri, datas, app, recid, callback, errback, fileKeys, idx + 1);
				}).catch(function(err) {
					errback(err);
				});
			}

			if (opt_callback || opt_errback) {
				return _uploadStorageBlobDatas(uri, datas, app, recid, opt_callback, opt_errback);
			}
			else {
				return new kintone.Promise(function(resolve, reject) {
					_uploadStorageBlobDatas(uri, datas, app, recid, function(resp) {
						resolve(resp);
					}, function(err) {
						reject(err);
					});
				});
			}
		},

		// データセンターのファイルサーバーにファイルを格納(DB版)
		// uri: ストレージ機能のURI
		// blob: ファイルデータ
		// name: ファイル名
		// app: アプリコード(添付先のアプリコード)
		// field: フィールドコード
		// recid: レコード番号
		uploadStorageFile: function(uri, blob, name, app, field, recid, opt_callback, opt_errback) {
			function _uploadStorageFile(uri, blob, name, app, field, recid, callback, errback) {
				if (!uri) {
					errback(window.RsComAPI.regional['undefineURI']); // URIが指定されていません
					return;
				}
				if (!app) {
					errback(window.RsComAPI.regional['undefineAppid']);
					return;
				}
				if (!field) {
					errback(window.RsComAPI.regional['undefineFieldCode']);
					return;
				}

				var formData = new FormData();
				formData.append('file', blob , name);

				var info = 'app:' + app + ',field:' + field;
				if (recid) info += ',recid:' + recid;
				var xhr = new XMLHttpRequest();
				var url = uri;
				if (uri.charAt(uri.length - 1) != '/') url += '/';
				url += 'api/storage/file.json';
				xhr.open('POST', url, true);
				xhr.setRequestHeader('X-Bok-StorageInfo', window.btoa(unescape(encodeURIComponent(info))));
				xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
				xhr.onload = function(event) {
					if (xhr.status == 200) {
						var resp = JSON.parse(xhr.response);
						callback(resp.fileKey);
						return;
					}
					var err;
					try {
						var msg = JSON.parse(xhr.response);
						err = msg['error'] || 'HTTP Status=' + xhr.status;
					}
					catch(e) {
						err = xhr.responseText;
					}
					errback({'message': err});
				}
				xhr.onerror = function(e) {
					errback({'message': e});
				}
				xhr.send(formData);
			}

			if (opt_callback || opt_errback) {
				return _uploadStorageFile(uri, blob, name, app, field, recid, opt_callback, opt_errback);
			}
			else {
				return new kintone.Promise(function(resolve, reject) {
					_uploadStorageFile(uri, blob, name, app, field, recid, function(resp) {
						resolve(resp);
					}, function(err) {
						reject(err);
					});
				});
			}
		},
		// レコードのファイルを確定
		// fileKey: ファイルキー(配列)
		// app: アプリID
		// recid: レコードID
		confirmStorageFile : function(uri, fileKeys, app, recid, opt_callback, opt_errback) {
			function _confirmStorageFile(uri, fileKeys, app, recid, callback, errback) {
				if (!uri) {
					errback(window.RsComAPI.regional['undefineURI']); // URIが指定されていません
					return;
				}
				if (!app) {
					errback(window.RsComAPI.regional['undefineAppid']);
					return;
				}
				if (!recid) {
					errback(window.RsComAPI.regional['undefineRecid']);
					return;
				}

				var info = 'app:' + app + ',recid:' + recid;
				var xhr = new XMLHttpRequest();
				var url = uri;
				if (uri.charAt(uri.length - 1) != '/') url += '/';
				url += 'api/storage/file.json';
				xhr.open('PUT', url, true);
				xhr.setRequestHeader('X-Bok-StorageInfo', window.btoa(unescape(encodeURIComponent(info))));
				xhr.setRequestHeader('Content-Type', 'application/json');
				xhr.onload = function(event) {
					if (xhr.status == 200) {
						var resp = JSON.parse(xhr.response);
						callback(resp.count);
						return;
					}
					var err;
					try {
						var msg = JSON.parse(xhr.response);
						err = msg['error'] || 'HTTP Status=' + xhr.status;
					}
					catch(e) {
						err = xhr.responseText;
					}
					errback({'message': err});
				}
				xhr.onerror = function(e) {
					errback({'message': e});
				}
				var parm = {
					'app': app,
					'recid': recid,
					'fileKey': fileKeys
				};
				xhr.send(JSON.stringify(parm));
			};

			if (opt_callback || opt_errback) {
				return _confirmStorageFile(uri, fileKeys, app, recid, opt_callback, opt_errback);
			}
			else {
				return new kintone.Promise(function(resolve, reject) {
					_confirmStorageFile(uri, fileKeys, app, recid, function(resp) {
						resolve(resp);
					}, function(err) {
						reject(err);
					});
				});
			}
		},
		// アプリID、アプリID+レコード番号　で削除
		deleteStorageFile : function(uri, app, recid, fileKeys, opt_callback, opt_errback) {
			function _deleteStorageFile(uri, app, recid, fileKeys, callback, errback) {
				if (!uri) {
					errback(window.RsComAPI.regional['undefineURI']); // URIが指定されていません
					return;
				}
				if (!app) {
					errback(window.RsComAPI.regional['undefineAppid']);
					return;
				}

				var info = 'app:' + app;
				if (recid) info += ',recid:' + recid;
				var xhr = new XMLHttpRequest();
				var url = uri;
				if (uri.charAt(uri.length - 1) != '/') url += '/';
				url += 'api/storage/file.json';
				xhr.open('DELETE', url, true);
				xhr.setRequestHeader('X-Bok-StorageInfo', window.btoa(unescape(encodeURIComponent(info))));
				xhr.setRequestHeader('Content-Type', 'application/json');
				xhr.onload = function(event) {
					if (xhr.status == 200) {
						var resp = JSON.parse(xhr.response);
						callback(resp.count);
						return;
					}
					var err;
					try {
						var msg = JSON.parse(xhr.response);
						err = msg['error'] || 'HTTP Status=' + xhr.status;
					}
					catch(e) {
						err = xhr.responseText;
					}
					errback({'message': err});
				}
				xhr.onerror = function(e) {
					errback({'message': e});
				}
				var parm = {
					'app': app
				};
				if (recid) parm['recid'] = recid;
				if (fileKeys) parm['fileKey'] = fileKeys;
				xhr.send(JSON.stringify(parm));
			};

			if (opt_callback || opt_errback) {
				return _deleteStorageFile(uri, app, recid, fileKeys, opt_callback, opt_errback);
			}
			else {
				return new kintone.Promise(function(resolve, reject) {
					_deleteStorageFile(uri, app, recid, fileKeys, function(resp) {
						resolve(resp);
					}, function(err) {
						reject(err);
					});
				});
			}
		},

		// 一時fileKey
		convStorageFile : function(uri, app, recid, fileKeys, opt_callback, opt_errback) {
			function _convStorageFile(uri, app, recid, fileKeys, callback, errback) {
				if (!uri) {
					errback(window.RsComAPI.regional['undefineURI']); // URIが指定されていません
					return;
				}
				if (!app) {
					errback(window.RsComAPI.regional['undefineAppid']);
					return;
				}
				if (!recid) {
					errback(window.RsComAPI.regional['undefineRecid']);
					return;
				}
				if (fileKeys == undefined || fileKeys == '' ||  fileKeys.length <= 0) {
					callback([]);
					return;
				}

				var info = 'app:' + app + ',recid:' + recid;
				var xhr = new XMLHttpRequest();
				var url = uri;
				if (uri.charAt(uri.length - 1) != '/') url += '/';
				url += 'api/storage/fileEx.json';
				xhr.open('PUT', url, true);
				xhr.setRequestHeader('X-Bok-StorageInfo', window.btoa(unescape(encodeURIComponent(info))));
				xhr.setRequestHeader('Content-Type', 'application/json');
				xhr.onload = function(event) {
					if (xhr.status == 200) {
						var resp = JSON.parse(xhr.response);
						callback(resp.fileKey);
						return;
					}
					var err;
					try {
						var msg = JSON.parse(xhr.response);
						err = msg['error'] || 'HTTP Status=' + xhr.status;
					}
					catch(e) {
						err = xhr.responseText;
					}
					errback({'message': err});
				}
				xhr.onerror = function(e) {
					errback({'message': e});
				}
				var parm = {
					'fileKey': fileKeys
				};
				xhr.send(JSON.stringify(parm));
			};

			if (opt_callback || opt_errback) {
				return _convStorageFile(uri, app, recid, fileKeys, opt_callback, opt_errback);
			}
			else {
				return new kintone.Promise(function(resolve, reject) {
					_convStorageFile(uri, app, recid, fileKeys, function(resp) {
						resolve(resp);
					}, function(err) {
						reject(err);
					});
				});
			}
		},

		// ファイルサーバーからファイルをダウンロード(物理ファイル版)
		// fileKey: ファイルキー
		downloadStorageFile : function(uri, fileKey, opt_bImg, app, recid, opt_callback, opt_errback) {
			var bImg = opt_bImg || false;

			function _downloadStorageFile(uri, fileKey, bImg, callback, errback) {
				if (app && recid) var info = 'app:' + app + ',recid:' + recid;
				var xhr = new XMLHttpRequest();
				var url = uri;
				if (uri.charAt(uri.length - 1) != '/') url += '/';
				url += 'api/storage/file.json';
				xhr.open('GET', url + '?fileKey=' + fileKey);
				xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
				if (info) xhr.setRequestHeader('X-Bok-StorageInfo', window.btoa(unescape(encodeURIComponent(info))));
				xhr.responseType = 'blob';
				xhr.onload = function() {
					if (xhr.status === 200) {
						var blob = new Blob([xhr.response]);
						if (bImg === true) {
							var urlBlob = URL.createObjectURL(blob);
							var img = new Image();
							img.onload = function(e) {
								callback(img);
							}
							img.onerror = function(e) {
								var img2 = new Image();
								img2.onload = function(e) {
									callback(img2);
								}
								img2.onerror = function(e2) {
									errback({'message': e});
								}
								img2.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFcAAAAhAQMAAACWfaXzAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURQAAAP///6XZn90AAAAJcEhZcwAADsMAAA7DAcdvqGQAAACESURBVCjPYyAGyP+HgQ8ksyU+/v/fD2MXEsE2fPi/x82Ov+MDiH2gvodBhp3hQQGDxMQj9T3JEscEnoHYffY9yfLHLI4ZwNhtFgeA7IMgtgwbgi3hZnH8A4wNUf8QZg6IfQDEhpj/EWhvsow7yF6Y+38g/PLPAonNiORHZiLDgSBgYAAADIjOzQtuKyIAAAAASUVORK5CYII=';
							}
							img.src = urlBlob;
						}
						else {
							callback(blob);
						}
					}
					else if (xhr.status === 403) {
						if (errback) errback('HTTPS Status = ' + xhr.status + '<br>' + window.RsComAPI.regional['checkAccessRights']);  //アクセス権を確認してください 
					}
					else {
						if (errback) errback('HTTPS Status = ' + xhr.status);
					}
				}
				xhr.onerror = function(e) {
//					console.log(xhr, e);
					errback(e);
				}

				xhr.send();
			};

			if (opt_callback || opt_errback) {
				return _downloadStorageFile(uri, fileKey, bImg, opt_callback, opt_errback);
			}
			else {
				return new kintone.Promise(function(resolve, reject) {
					_downloadStorageFile(uri, fileKey, bImg, function(resp) {
						resolve(resp);
					}, function(err) {
						reject(err);
					});
				});
			}
		},


		// サーバの時間を所得
		// return Date型
		getSystemDate: function(opt_callback, opt_errback) {
			function _getSystemDate(callback, errback) {
				var xhr = new XMLHttpRequest();
				xhr.open('GET', '/');
				xhr.onload = function() {
					RsComAPI.traceLog('getSystemDate#onload = ', xhr);
					var headerDate = xhr.getResponseHeader('date');
					var day = null;
					try {
						day = new Date(headerDate);
						callback(day);
					}
					catch(e) {
						RsComAPI.errorLog('getSystemDate#err headerDate = ', headerDate);
						callback(new Date());
					}
				}
				xhr.onerror = function(e) {
					RsComAPI.errorLog('getSystemDate#onerror = ', xhr, e);
					if (errback) errback(e);
				}
				xhr.send();
			}
			if (opt_callback || opt_errback) {
				return _getSystemDate(opt_callback, opt_errback);
			}
			else {
				return new kintone.Promise(function(resolve, reject) {
					_getSystemDate(function(resp) {
						resolve(resp);
					}, function(err) {
						reject(err);
					});
				});
			}
		},

		// DATE を YYYY-MM-DD に変換
		dateToISODate: function(dt) {
			return dt.toISOString().substring(0, 10);
		},

		// DATE を YYYY-MM-DDThh:mm:ssZ に変換
		dateToISODatetime: function(dt) {
			return dt.toISOString().substring(0, 19) + 'Z';
		},

		// 住所をカスタマバーコード用の住所に変換
		addressToCustomcode(no, addr) {
			var i, j, ii, jj;
	    var de = ['丁目', '丁', '番地', '番', '号', '地割', '線', 'の', 'ノ'];  // 特定文字
	    var numchar = '一二三四五六七八九〇十１２３４５６７８９０1234567890－-';
	    var CNUM = '0123456789';
	    var CALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
			no = (no || '').replace('-', '');

	//  console.log('0', addr);
	    var addr1 = (addr || '').toUpperCase();
			if (no == '' && addr1 == '') return '';

	//  console.log('1', addr1);
	    var addr2 = addr1.split(/[&\/・\.]/).join('');
	//  console.log('2', addr2);
	    addr1 = '';
	    var pos, c;
	    for (pos = 0; pos < addr2.length;) {
	      for (ii = 0; ii < de.length; ii++) {
	        var idx = addr2.substring(pos).indexOf(de[ii]);
	        if (idx > 0) break;
	      }
	      if (ii >= de.length) { // 以降に特定文字はない
	        addr1 += addr2.substring(pos);
	        break;
	      }
	      // 特定文字の前が数値か確認
	      for (jj = idx - 1; jj >= 0 && numchar.indexOf(addr2.charAt(pos + jj)) >= 0; jj--);
	      addr1 += addr2.substring(pos, pos + jj + 1);
	      if (jj <= idx - 1) {
	        var bnum = [];
	        for (j = idx - 1; j > jj; j--) {
	          var ix;
	          c = addr2.charAt(pos + j);
	          if (CNUM.indexOf(c) >= 0) bnum.push(c);
	          else if ((ix = '０１２３４５６７８９'.indexOf(c)) >= 0) bnum.push(CNUM.charAt(ix));
	          else if (c == '十') {
	            if (j - 1 <= jj) bnum.push('1');  // 十が先頭にある場合
	            if (j >= idx - 1) bnum.push('0'); // 十が最後にある場合
	          }
	          else if ((ix = '〇一二三四五六七八九'.indexOf(c)) >= 0) bnum.push(CNUM.charAt(ix));
						else if (c == '－' || c == '-') bnum.push('-');
	        }
	        for (j = bnum.length - 1; j >= 0; j--) addr1 += bnum[j];
	      }
	      addr1 += de[ii];
	      pos += idx + de[ii].length;
	    }
	//  console.log('3', addr1);
	    var stack = [];
	    for (i = addr1.length - 1; i >= 0; i--) {
	      c = addr1.charAt(i);
	      if (CNUM.indexOf(c) >= 0) stack.push(c);
	      else if (CALPHA.indexOf(c) >= 0) {
	        if (c == 'F') {
	          for (ii = i - 1; ii >= 0 && CNUM.indexOf(addr1.charAt(ii)) >= 0; ii--);
	          if (i - ii <= 0) {            // 前が数字以外
	            for (ii = i - 1; ii >= 0 && CALPHA.indexOf(addr1.charAt(ii)) >= 0 ; ii--);
	            if (i - ii <= 1) stack.push(c); // 1文字だったらスタック
	            else stack.push('-');
	            i = ii + 1;
	          }
	          else stack.push('-');
	        }
	        else {
	          for (ii = i - 1; ii >= 0 && CALPHA.indexOf(addr1.charAt(ii)) >= 0 ; ii--);
	          if (i - ii <= 1) stack.push(c); // 1文字だったらスタック
	          else stack.push('-');
	          i = ii + 1;
	        }
	      }
	      else stack.push('-');
	    }
	//  console.log('4', stack);
	    var h = true;
	    addr2 = '';
	    for (i = stack.length - 1; i >= 0; i--) {
	      c = stack[i];
	      if (h == true) {
	        if (c == '-') continue;
	        addr2 += c;
	        h = false;
	      }
	      else {
	        addr2 += c;
	        if (c == '-') h = true;
	      }
	    }
	//  console.log('5', addr2);
	    stack = [];
	    for (i = 0; i < addr2.length; i++) stack.push(addr2.charAt(i));
	    for (i = 0; i < stack.length; i++) {
	      c = stack[i];
	      if (CALPHA.indexOf(c) >= 0) { // アルファベットの前および後のハイフンを取り除く
	        var posBef = -1;
	        var posAft = -1;
	        if (i > 0 && stack[i - 1] == '-') posBef = i - 1;
	        if (i <= stack.length - 1 && stack[i + 1] == '-') posAft = i + 1;
	        if (posAft >= 0) stack.splice(posAft, 1);
	        if (posBef >= 0) {
	          stack.splice(posBef, 1);
	          i--;
	        }
	      }
	    }
	    if (stack.length > 0 && stack[0] == '-') stack.splice(0, 1);
	    if (stack.length > 0 && stack[stack.length - 1] == '-') stack.splice(stack.length - 1, 1);
	//  console.log('6', stack);
	    addr1 = stack.join('');
	    var len = addr1.length;
	    if (len > 13) len = 13;
	    return (no + '0000000').substring(0, 7) + addr1.substring(0, len);
		}
	}

    window.RsComAPI.setRegional('ja');

	if (window._) {
		var __ = window._;
	}
	window._ = RsComAPI;


})(jQuery);
