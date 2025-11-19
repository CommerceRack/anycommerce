REM %1 should be the location of openssl
REM %2 should be the domain you are writing a key for

%1 genrsa -out test.key 2048
%1 req -new -key test.key -out %2.csr
%1 x509 -req -in %2.csr -signkey test.key -out %2.crt