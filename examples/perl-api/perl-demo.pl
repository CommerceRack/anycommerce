#!/usr/bin/perl

use strict;

use lib "/httpd/modules";
use LWP::UserAgent;
use Digest::MD5;
use JSON::Syck;
use Data::Dumper;

## 
## www.zoovy.com/webdoc/index.cgi?VERB=DOC&DOCID=51609&keywords=jquery
## 

sub make_call {
	my ($input) = @_;

	my ($ua) = LWP::UserAgent->new();
	$ua->env_proxy;
	my $req = HTTP::Request->new("POST","http://www.zoovy.com/webapi/jquery/index.cgi");
	$req->header('Content_Type' => 'application/json');
	$req->content(JSON::Syck::Dump($input));
	my ($r) = $ua->request($req);
	my $out = JSON::Syck::Load($r->content());
	return($out);
	}

my $USERNAME = 'brian';
my $PASSWORD = 'asdf';

my $t = time();
my %vars = ();
$vars{'_uuid'} = time();
$vars{'_cmd'} = 'appSessionStart';
$vars{'login'} = $USERNAME;
$vars{'hashtype'} = 'md5';
$vars{'security'} = 'xyz';
$vars{'ts'} = $t;
$vars{'hashpass'} = Digest::MD5::md5_hex(sprintf("%s%s%s",$PASSWORD,$vars{'security'},$vars{'ts'}));

print Dumper(&make_call(\%vars));


