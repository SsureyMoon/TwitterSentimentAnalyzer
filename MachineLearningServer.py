import os
import sys
import pickle
import re
import time
import signal
import socket
import time

from tweepy import Stream
from tweepy import OAuthHandler
from tweepy.streaming import StreamListener
from tweepy.utils import import_simplejson, urlencode_noplus
from tweepy.models import Status
from tweepy.api import API
from tweepy.error import TweepError

STREAM_VERSION = '1.1'

from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfTransformer
from sklearn.naive_bayes import BernoulliNB, MultinomialNB
from sklearn.feature_selection import SelectKBest
from sklearn.feature_selection import chi2

import numpy as np


json = import_simplejson()

ckey = '9Bh86FuaqtY9kxWjKVfUDCUl6'
csecret = 'uSYohydy2V3vHfSG191oCn1lroPvwQv6Pq6Ahq02r8Jc1uanRl'
atoken = '134144530-DZAjQUMTVd1SQXBYDCHxodrfWupHKAqapG3OxHYF'
asecret = 'HmBMfexJRNbdtth2SHwa37vNwzyyWb61SWl2fS1PwjihJ'



def tweetPreprocessor(line):
	
	l2 = re.sub(r'\\', '', line.strip())
	l2 = re.sub(r'"', '', l2)
	l2 = re.sub(r'\'', '', l2)
	l2 = re.sub(r'{', '', l2)
	l2 = re.sub(r'}', '', l2)

	l2 = re.sub(r'\\[A-Za-z0-9].[^\s]*([\s\n]|$)', ' ', l2)

	l2 = re.sub(r'[Hh][Tt][Tt][Pp][Ss]*.[^\s]*([\s\n]|$)', ' ', l2)
	l2 = re.sub(r'@.[^\s]*([\s\n]|$)', '_NAME_ ', l2)
	l2 = re.sub(r'#.[^\s]*([\s\n]|$)', '_HASH_ ', l2)

	return l2



class listener(StreamListener):

	def __init__(self, api=None):

		self.api = api or API()

		file_path = os.path.join(os.path.split(__file__)[0], "models")

		prefix = "twitter_external_bigram_with_internal_words"

		file_name = file_path + '/' + prefix + '_vectorizer_' + '.model'


		fileObj = open(file_name, 'r')
		self.vectorizer = pickle.load(fileObj)
		fileObj.close()

		file_name = file_path + '/' + prefix + '_classifier_' + '.model'
		
		fileObj = open(file_name, 'r')
		self.classifier = pickle.load(fileObj)
		fileObj.close()

		self.refined_tweet = None
		self.tweet = "Init"
		self.tag = "IDK"
		self.total = 0
		self.neg_count = 0
		self.pos_count = 0
		self.ratio = 50

		print "Let the analysis begin"
		print "========================================="


	def on_data(self, raw_data):
		print "data"


		try:

			if self.total <= 100:
				self.total += 1

				self.tweet = raw_data.split(',"text":"')[1].split('","source')[0]
				self.refined_tweet = tweetPreprocessor(self.tweet)
				self.tweet_vector = self.vectorizer.transform([self.refined_tweet]).toarray()
				self.pred = self.classifier.predict(self.tweet_vector)

				if self.pred == "0":
					self.neg_count += 1
					self.tag = "NEGATIVE"
				elif self.pred == "4":
					self.pos_count += 1
					self.tag = "POSITIVE"
				else:
					self.tag = "IDK"

				self.ratio = self.pos_count*100.00/self.total
					
				self.message = json.dumps({"head":"_data_", "text":self.refined_tweet, "tag":self.tag, "ratio":self.ratio})
				conn.send(self.message+'\n')
			elif self.total == 101:
				self.total += 1
				self.message = json.dumps({"head":"_end_", "text":self.refined_tweet, "tag":self.tag, "ratio":self.ratio})
				conn.sendall(self.message+'\n')
			else:
				pass


		except BaseException, e:
			print 'failed ondata: ', str(e)


def task(args):
	keywords = [args]

	auth = OAuthHandler(ckey, csecret)
	auth.set_access_token(atoken, asecret)

	
	twitterStream = Stream(auth, listener())
	twitterStream.filter(track=keywords, async=True)
	
	




HOST = '127.0.0.1'  # Symbolic name meaning the local host
PORT = int(sys.argv[1])     # Arbitrary non-privileged port
keyword = sys.argv[2]     # Arbitrary non-privileged port

conn = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
conn.connect((HOST, PORT))



time
while 1:
	
	pairSessionKeyword = conn.recv(2048).strip()
	print pairSessionKeyword
	head, nothing= pairSessionKeyword.split(', ')


	if not pairSessionKeyword:
		pass
	else:
		print "got header:", head, " |  keyword:", keyword			

		if head == "close":
			conn.close()
			time.sleep(1)
			sys.exit(1)
		elif head == "start":
			task(keyword)
			pass
		else:
			print "nothing"


#p2 = Process(target=f, args=('goerge',))
#p2.start()