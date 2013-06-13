<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xal="http://xml.apache.org/xalan" xmlns:x="urn:schemas-microsoft-com:xslt" exclude-result-prefixes="x">

	<xsl:variable name="RootNode" select="/eBay" />

	<xsl:variable name="StockPhotoURL" select="/eBay/ProductInfo/StockPhotoURL" />

	<xsl:template name="BuildPresentationInstructions">
		<xsl:param name="PI"/>
		<xsl:param name="PI.Conditional"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="VCSID"/>
		<xsl:choose>
			<xsl:when test="$subPage = 'API' ">
				<xsl:call-template name="SplitPresentationInstructions">
					<xsl:with-param name="PI.Rows" select="$PI/Row"/>
					<xsl:with-param name="PI.Conditional.Rows" select="$PI.Conditional/Row"/>
					<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
					<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
					<xsl:with-param name="VCSID" select="$VCSID"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:call-template name="SplitPresentationInstructions">
					<xsl:with-param name="PI.Rows" select="$PI/Row"/>
					<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
					<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
					<xsl:with-param name="VCSID" select="$VCSID"/>
				</xsl:call-template>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
	<xsl:template name="SplitPresentationInstructions">
		<xsl:param name="PI.Rows"/>
		<xsl:param name="PI.Conditional.Rows"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="VCSID"/>
		<xsl:call-template name="BuildRows">
			<xsl:with-param name="Rows" select="$PI.Rows"/>
			<xsl:with-param name="PI.Conditional.Rows" select="$PI.Conditional.Rows"/>
			<xsl:with-param name="Mode" select="'FirstRun'"/>
			<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
			<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
			<xsl:with-param name="VCSID" select="$VCSID"/>
		</xsl:call-template>
		<xsl:if test="$CurrentAttributeXPath/EditType =2">
			<xsl:call-template name="BuildRows">
				<xsl:with-param name="Rows" select="$PI.Rows"/>
				<xsl:with-param name="PI.Conditional.Rows" select="$PI.Conditional.Rows"/>
				<xsl:with-param name="Mode" select="'SecondRun'"/>
				<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
				<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
				<xsl:with-param name="VCSID" select="$VCSID"/>
			</xsl:call-template>
		</xsl:if>
	</xsl:template>
	
	<xsl:template name="BuildRows">
		<xsl:param name="Rows"/>
		<xsl:param name="PI.Conditional.Rows"/>
		<xsl:param name="Mode"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="VCSID"/>
		<xsl:for-each select="$Rows">
			<xsl:choose>
				<xsl:when test="$Mode = 'FirstRun' and ((key('CheckForType1or2', concat($VCSID ,':',1,':', Widget/Attribute/@id))  and  not(key('CheckForAttributeWithValue', concat($VCSID,':',Widget/Attribute/@id)))) or (key('CheckForType1or2', concat($VCSID ,':',2,':', Widget/Attribute/@id))  and (key('CheckForUserSource', concat($VCSID,':',Widget/Attribute/@id)) or not(key('CheckForSource', concat($VCSID,':',Widget/Attribute/@id))))))">
				</xsl:when>
				<xsl:when test="$Mode = 'SecondRun' and not(key('CheckForType1or2', concat($VCSID ,':',2,':', Widget/Attribute/@id))  and (key('CheckForUserSource', concat($VCSID,':',Widget/Attribute/@id)) or not(key('CheckForSource', concat($VCSID,':',Widget/Attribute/@id)))))">
				</xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="BuildConditionalOrStandard">
						<xsl:with-param name="Row" select="."/>
						<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
						<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
					</xsl:call-template>
					<xsl:if test="$PI.Conditional.Rows">
						<xsl:variable name="CurrentRow" select="."/>
						<xsl:variable name="Conditional.Rows" select="$PI.Conditional.Rows[Widget/Attribute/@id = $CurrentAttributeXPath[@id = $CurrentRow/Widget/Attribute/@id]/Dependency/@childAttrId]"/>
						<xsl:if test="$Conditional.Rows">
							<xsl:call-template name="BuildRows">
								<xsl:with-param name="Rows" select="$Conditional.Rows"/>
								<xsl:with-param name="PI.Conditional.Rows" select="$PI.Conditional.Rows"/>
								<xsl:with-param name="Mode" select="''"/> <!-- always show -->
								<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
								<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
								<xsl:with-param name="VCSID" select="$VCSID"/>
							</xsl:call-template>
						</xsl:if>
					</xsl:if>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:for-each>
	</xsl:template>


	<xsl:template name="BuildConditionalOrStandard">
		<xsl:param name="Row"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:variable name="DoesRowPass">
			<xsl:if test="$IsConditional and Widget/Attribute[@id=$CurrentAttributeXPath/@id]">
				<xsl:value-of select="'Pass'"/>
			</xsl:if>
		</xsl:variable>
		<xsl:if test="(not($IsConditional) or contains($DoesRowPass,'Pass') or $subPage='API' and Widget/@type='text_message') and (not(Widget/@isVisible) or (Widget/@isVisible='nc' or Widget/@isVisible='y'))">
			<xsl:call-template name="BuildActualRow">
				<xsl:with-param name="Row" select="$Row"/>
				<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
				<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
			</xsl:call-template>
		</xsl:if>
	</xsl:template>
	
<xsl:key name="attrByIDs" match="/eBay/Characteristics/CharacteristicsSet[@id = /eBay/SelectedAttributes/AttributeSet/@id]/CharacteristicsList/*/Attribute[@id=/eBay/SelectedAttributes/AttributeSet/Attribute/@id]/Dependency[(@type='3' or @type='4' or @type='5') and @parentValueId=/eBay/SelectedAttributes/AttributeSet/Attribute/Value/@id]/Value" use="concat(../../../../../@id, '_', ../../@id, '_', @id)"/>
<xsl:key name="selectedAttrByIDs" match="/eBay/SelectedAttributes/AttributeSet/Attribute" use="concat(../@id, '_', @id, '_', Value/@id)"/>

<xsl:template name="BuildActualRow">
		<xsl:param name="Row"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:if test="$Row/Widget[Attribute/@id = $CurrentAttributeXPath/@id] or $Row/Widget/@type='text_message'">
			<table border="0" cellspacing="0" cellpadding="2">
				<tr valign="top">
					<xsl:for-each select="$Row/Widget">
					
						<!-- Check on visibility of parent attributes and values, this is only for API case -->
						<xsl:variable name="attributeState">
							<xsl:if test="$subPage = 'API' ">
								<xsl:apply-templates mode="API.CheckOnVisibility" select="Attribute">
									<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
									<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
								</xsl:apply-templates>
							</xsl:if>
						</xsl:variable>
						<xsl:if test="not($attributeState='invisible') and (not($IsConditional) or Attribute[@id = $CurrentAttributeXPath/@id] or $subPage='API' and $Row/Widget/@type='text_message')">
							<xsl:call-template name="BuildWidget">
								<xsl:with-param name="Widget" select="."/>
								<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
								<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
							</xsl:call-template>
						</xsl:if>
					</xsl:for-each>
				</tr>
			</table>
		</xsl:if>
	</xsl:template>
	
	<xsl:template mode="API.CheckOnVisibility" match="Attribute">
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:if test="name(../../parent::node()) = 'Conditional' ">
			<xsl:variable name="attrId" select="@id"/>
			<xsl:variable name="thisParentId" select="$CurrentAttributeXPath[Dependency/@childAttrId=$attrId]/@id"/>
			<xsl:variable name="parentValueId" select="$SelectedAttributeXPath[@id=$thisParentId]/Value/@id"/>
			<xsl:variable name="parentAttribute" select="$CurrentAttributeXPath[@id=$thisParentId and Dependency[@childAttrId=$attrId and (@type='3' or @type='4' or @type='5') and @parentValueId=$parentValueId]]"/>
			<xsl:choose>
				<xsl:when test="$parentAttribute">
					<xsl:apply-templates mode="API.CheckOnVisibility" select="../../parent::node()/Row/Widget/Attribute[@id=$parentAttribute/@id]">
						<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
						<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
					</xsl:apply-templates>
				</xsl:when>
				<xsl:otherwise><![CDATA[invisible]]></xsl:otherwise>
			</xsl:choose>
		</xsl:if>
	</xsl:template>
	
	<xsl:template name="BuildWidget">
		<xsl:param name="Widget"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<!--Zac go back  [@id=$thisParentId]/Dependency[@childAttrId=$attrId and @type='4'] -->
		
		 <xsl:choose>
			 <xsl:when test="$Widget/Attribute/Input[@type = 'hidden']">
			 	<xsl:apply-templates select="$Widget/Attribute/Input[@type = 'hidden']" mode="attributes">
			 	<xsl:with-param name="attrId" select="$Widget/Attribute/@id" /> 
  			 	<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath" /> 
  			 	<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath" /> 
  				</xsl:apply-templates>
  			</xsl:when>
		 <xsl:otherwise>
 			<xsl:if test="((Attribute[@hide='true'] and $CurrentAttributeXPath) or not(Attribute/@hide='true'))">
			<td valign="top">
			<table border="0" cellpadding="0" cellspacing="0">
				<xsl:choose>
					<xsl:when test="$Widget/@type = 'normal'">
						<xsl:apply-templates select="Attribute[@id = $CurrentAttributeXPath/@id]">
							<xsl:with-param name="widgetType" select="@type"/>
							<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
							<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
						</xsl:apply-templates>
					</xsl:when>					
					<xsl:when test="($Widget/@type = 'text_message' and not($CurrentAttributeXPath[../../../PromoTop])) or ($thisPage='PF' and $Widget/@type = 'text_message')">
						<xsl:apply-templates select="TextMessage"/>
					</xsl:when>
					<xsl:otherwise>						
						<tr>  			<xsl:apply-templates select="Attribute">
											<xsl:with-param name="widgetType" select="@type"/>											
											<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
											<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
										</xsl:apply-templates>
								<!--	</tr>
								</table>
							</td> -->
						</tr>						
					</xsl:otherwise>
				</xsl:choose>
			</table>
		</td>
		</xsl:if>
		 </xsl:otherwise>
  		</xsl:choose>
	</xsl:template>

	<xsl:template match="Attribute">
		<xsl:param name="attrId" select="@id"/>
		<xsl:param name="widgetType"/>
		<xsl:param name="attrMessagePFTop" select="Message[@quadrant='top']"/>
		<xsl:param name="attrMessagePFBottom" select="Message[@quadrant='bottom']"/>
		<xsl:param name="attrMessagePFLeft" select="Message[@quadrant='left']"/>
		<xsl:param name="attrMessagePFRight" select="Message[@quadrant='right']"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:variable name="attrMessageTop" select="normalize-space($CurrentAttributeXPath[@id = $attrId]/MessageTop)"/>
		<xsl:variable name="attrMessageBottom" select="normalize-space($CurrentAttributeXPath[@id = $attrId]/MessageBottom)"/>
		<xsl:variable name="attrMessageLeft" select="normalize-space($CurrentAttributeXPath[@id = $attrId]/MessageLeft)"/>
		<xsl:variable name="attrMessageRight" select="normalize-space($CurrentAttributeXPath[@id = $attrId]/MessageRight)"/>
		<xsl:variable name="isLabelVisible" select="boolean($CurrentAttributeXPath[@id=$attrId and @labelVisible = 'true'])"/>
		<xsl:variable name="VCSID" select="../../../../../@id"/>
		<!-- ItemSpecifics page id = 1150 -->
		<xsl:if test="$subPage != 'API' or $CurrentAttributeXPath[@id = $attrId and name(..) != 'Other'][not(@pageLocation) and (not(/eBay/SelectedAttributes/@pageId) or /eBay/SelectedAttributes/@pageId = '1150') or @pageLocation = /eBay/SelectedAttributes/@pageId]">
			<xsl:if test="$subPage = 'API' and $CurrentAttributeXPath/Dependency[@childAttrId=$attrId and @type='5'] ">
				<input type="hidden" name="attr_required_{$VCSID}_{$attrId}" value="true"/>
			</xsl:if>
			<!-- BUGDB00146474 + BUGDB00191367 remove messages from API -->
			<xsl:variable name="ShowMessage">
				<xsl:choose>
					<xsl:when test=" $SelectedAttributeXPath[@id=$attrId]/@removeMsg != '' and $SelectedAttributeXPath[@id=$attrId]/@removeMsg = 'true' ">
						<xsl:value-of select="false()" />
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="true()" />
					</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>
			<xsl:choose>
				<xsl:when test="$SelectedAttributeXPath[@id=$attrId and @noEdit='true'] and $CurrentAttributeXPath[@id=$attrId and (EditType = 1 or EditType = 2)]">
					<tr>
						<td nowrap="nowrap" width="80" valign="top">
						<xsl:if test="$thisPage='SYI' and ($SelectedAttributeXPath[@id=$attrId]/Value[@id > 0] or $SelectedAttributeXPath[@id=$attrId]/Value[@id = -6 or @id = -3])">
					<input type="hidden" name="{concat('attr_h',$VCSID, '_', $attrId)}">
						<xsl:attribute name="value">
						<xsl:for-each select="$SelectedAttributeXPath[@id=$attrId]/Value">
						<xsl:value-of select="@id"/><xsl:if test="position() != last()">,</xsl:if>
						</xsl:for-each>
						</xsl:attribute>
						</input>
						</xsl:if>
							<xsl:choose>
								<xsl:when test="$isLabelVisible">
									<xsl:apply-templates select="Label" mode="ryi">
										<xsl:with-param name="attrId" select="$attrId"/>
										<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
									</xsl:apply-templates>
								</xsl:when>
								<xsl:otherwise>&#160;</xsl:otherwise>
							</xsl:choose>						
						</td>
						<td width="10">&#160;&#160;</td>
						<td valign="top">
							<xsl:apply-templates select="Input" mode="ryi">
								<xsl:with-param name="attrId" select="$attrId"/>
								<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
								<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
							</xsl:apply-templates>
						</td>
					</tr>
				</xsl:when>
				<xsl:when test="$SelectedAttributeXPath[@id=$attrId and @noEdit='true']">
					<xsl:if test="Label[.!='&#160;' or .!='spacer'] or $isLabelVisible">
						<tr>
							<td nowrap="nowrap" valign="top">
								<xsl:apply-templates select="Label" mode="ryi">
									<xsl:with-param name="attrId" select="$attrId"/>
									<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
								</xsl:apply-templates>
							</td>
						</tr>
					</xsl:if>
					<tr>
						<td valign="top">
		<xsl:if test="$thisPage='SYI' and ($SelectedAttributeXPath[@id=$attrId]/Value[@id > 0] or $SelectedAttributeXPath[@id=$attrId]/Value[@id = -6 or @id = -3])">
					<input type="hidden" name="{concat('attr_h',$VCSID, '_', $attrId)}">
						<xsl:attribute name="value">
						<xsl:for-each select="$SelectedAttributeXPath[@id=$attrId]/Value">
						<xsl:value-of select="@id"/><xsl:if test="position() != last()">,</xsl:if>
						</xsl:for-each>
						</xsl:attribute>
						</input>
						</xsl:if>
							<xsl:apply-templates select="Input" mode="ryi">
								<xsl:with-param name="attrId" select="$attrId"/>
								<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
								<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
							</xsl:apply-templates>
						</td>
					</tr>
				</xsl:when>
				<xsl:when test="$widgetType='normal'">
					<xsl:if test="($attrMessageTop != '' and $ShowMessage = 'true') or $attrMessagePFTop">
						<tr>
							<td><xsl:attribute name="colspan"><xsl:if test="$attrMessagePFTop and $thisPage='PF'">3</xsl:if></xsl:attribute>
								<xsl:call-template name="DisplayMessage">
									<xsl:with-param name="attrId" select="$attrId"/>
									<xsl:with-param name="attrMessage" select="$attrMessageTop"/>
									<xsl:with-param name="messageStyle" select="../MessageTop"/>
									<xsl:with-param name="attrMessagePF" select="$attrMessagePFTop"/>
								</xsl:call-template>
							</td>
						</tr>
					</xsl:if>
					<tr>
						<td>
							<table border="0" cellpadding="0" cellspacing="0">
								<tr>
									<xsl:if test="($attrMessageLeft!= '' and $ShowMessage = 'true') or $attrMessagePFLeft">
										<td>
											<xsl:call-template name="DisplayMessage">
												<xsl:with-param name="attrId" select="$attrId"/>
												<xsl:with-param name="attrMessage" select="$attrMessageLeft"/>
												<xsl:with-param name="messageStyle" select="../MessageLeft"/>
												<xsl:with-param name="attrMessagePF" select="$attrMessagePFLeft"/>
											</xsl:call-template>
										</td>
									</xsl:if>
									<td>
										<!-- output input and label -->
										<table border="0" cellpadding="0" cellspacing="0">
											<xsl:choose>
												<xsl:when test="@quadrant = 'bottom'">
													<xsl:call-template name="AttributeQuadrantBottom">
														<xsl:with-param name="attrId" select="$attrId"/>
														<xsl:with-param name="VCSID" select="$VCSID"/>
														<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
														<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
													</xsl:call-template>
												</xsl:when>
												<xsl:when test="@quadrant = 'top'">
													<xsl:call-template name="AttributeQuadrantTop">
														<xsl:with-param name="attrId" select="$attrId"/>
														<xsl:with-param name="VCSID" select="$VCSID"/>
														<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
														<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
													</xsl:call-template>
													<noscript>
														<xsl:if test="$thisPage='SYI' and NoJS">
															<tr>
																<td>
																	<xsl:copy-of select="$Image.ArrowMaroon"/>
																	<font size="2" face="Arial, Helvetica, sans-serif">Click Update below to see relevant choices</font>
																</td>
															</tr>
														</xsl:if>
													</noscript>
												</xsl:when>
												<xsl:when test="@quadrant = 'left'">
													<xsl:call-template name="AttributeQuadrantLeft">
														<xsl:with-param name="attrId" select="$attrId"/>
														<xsl:with-param name="VCSID" select="$VCSID"/>
														<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
														<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
													</xsl:call-template>
												</xsl:when>
												<xsl:when test="@quadrant = 'right'">
													<xsl:call-template name="AttributeQuadrantRight">
														<xsl:with-param name="attrId" select="$attrId"/>
														<xsl:with-param name="VCSID" select="$VCSID"/>
														<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
														<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
													</xsl:call-template>
												</xsl:when>
												<xsl:otherwise>
													<tr>
														<td><xsl:choose><xsl:when test="$thisPage!='PF'"><xsl:attribute name="nowrap"><xsl:value-of select="'nowrap'"/></xsl:attribute></xsl:when><xsl:otherwise></xsl:otherwise></xsl:choose>
															<xsl:apply-templates select="Label">
																<xsl:with-param name="attrId" select="$attrId"/>
																<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
															</xsl:apply-templates>
														</td>
													</tr>
												</xsl:otherwise>
											</xsl:choose>
										</table>
										<!-- end input and label -->
									</td>
									<xsl:if test="($attrMessageRight!= '' and $ShowMessage = 'true') or $attrMessagePFRight">
										<td>
											<xsl:call-template name="DisplayMessage">
												<xsl:with-param name="attrId" select="$attrId"/>
												<xsl:with-param name="attrMessage" select="$attrMessageRight"/>
												<xsl:with-param name="messageStyle" select="../MessageRight"/>
												<xsl:with-param name="attrMessagePF" select="$attrMessagePFRight"/>
											</xsl:call-template>
										</td>
									</xsl:if>
								</tr>
							</table>
						</td>
					</tr>
					<xsl:if test="($attrMessageBottom != '' and $ShowMessage = 'true') or $attrMessagePFBottom">
						<tr>
							<td><xsl:attribute name="colspan"><xsl:if test="$attrMessagePFBottom and $thisPage='PF'">3</xsl:if></xsl:attribute>
								<xsl:call-template name="DisplayMessage">
									<xsl:with-param name="attrId" select="$attrId"/>
									<xsl:with-param name="attrMessage" select="$attrMessageBottom"/>
									<xsl:with-param name="messageStyle" select="../MessageBottom"/>
									<xsl:with-param name="attrMessagePF" select="$attrMessagePFBottom"/>
								</xsl:call-template>
							</td>
						</tr>
					</xsl:if>
				</xsl:when>
				<!-- end widget type = "normal" -->
				<xsl:otherwise>
					<td><!--  valign="top" -->
						<table border="0" cellpadding="0" cellspacing="0">
							<!-- BUGDB00146474 remove messages from API -->
							<xsl:if test="$attrMessageTop != ''  and $ShowMessage = 'true' ">
								<tr>
									<td>
										<xsl:call-template name="DisplayMessage">
											<xsl:with-param name="attrId" select="$attrId"/>
											<xsl:with-param name="attrMessage" select="$attrMessageTop"/>
											<xsl:with-param name="messageStyle" select="MessageTop"/>
										</xsl:call-template>
									</td>
								</tr>
							</xsl:if>
							<tr>
								<!-- BUGDB00146474 remove messages from API -->
								<xsl:if test="$attrMessageLeft!= ''  and $ShowMessage = 'true' ">
												<td>
													<xsl:call-template name="DisplayMessage">
														<xsl:with-param name="attrId" select="$attrId"/>
														<xsl:with-param name="attrMessage" select="$attrMessageLeft"/>
														<xsl:with-param name="messageStyle" select="MessageLeft"/>
													</xsl:call-template>
												</td>
											</xsl:if>
											<td>
											<table border="0" cellpadding="0" cellspacing="0">
													<!-- display label and input -->
													<xsl:choose>
														<xsl:when test="@quadrant = 'bottom'">
															<xsl:call-template name="AttributeQuadrantBottom">
																<xsl:with-param name="attrId" select="$attrId"/>
																<xsl:with-param name="VCSID" select="$VCSID"/>
																<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
																<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
															</xsl:call-template>
														</xsl:when>
														<xsl:when test="@quadrant = 'top'">
															<xsl:call-template name="AttributeQuadrantTop">
																<xsl:with-param name="attrId" select="$attrId"/>
																<xsl:with-param name="VCSID" select="$VCSID"/>
																<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
																<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
															</xsl:call-template>
														</xsl:when>
														<xsl:when test="@quadrant = 'left'">
															<xsl:call-template name="AttributeQuadrantLeft">
																<xsl:with-param name="attrId" select="$attrId"/>
																<xsl:with-param name="VCSID" select="$VCSID"/>
																<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
																<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
															</xsl:call-template>
														</xsl:when>
														<xsl:when test="@quadrant = 'right'">
															<xsl:call-template name="AttributeQuadrantRight">
																<xsl:with-param name="attrId" select="$attrId"/>
																<xsl:with-param name="VCSID" select="$VCSID"/>
																<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
																<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
															</xsl:call-template>
														</xsl:when>
														<xsl:otherwise>
															<tr>
																<td>
																	<xsl:apply-templates select="Label">
																		<xsl:with-param name="attrId" select="$attrId"/>
																		<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
																	</xsl:apply-templates>&#160;
																</td>
															</tr>
														</xsl:otherwise>
													</xsl:choose>
													<!-- end display label and input -->
												</table>	
											</td>
											<!-- BUGDB00146474 remove messages from API -->
											<xsl:if test="$attrMessageRight!= ''  and $ShowMessage = 'true' ">
												<td>
													<xsl:call-template name="DisplayMessage">
														<xsl:with-param name="attrId" select="$attrId"/>
														<xsl:with-param name="attrMessage" select="$attrMessageRight"/>
														<xsl:with-param name="messageStyle" select="MessageRight"/>
													</xsl:call-template>
												</td>
											</xsl:if>	
							</tr>
							<!-- BUGDB00146474 remove messages from API -->
							<xsl:if test="$attrMessageBottom != ''  and $ShowMessage = 'true' ">
								<tr>
									<td>
										<xsl:call-template name="DisplayMessage">
											<xsl:with-param name="attrId" select="$attrId"/>
											<xsl:with-param name="attrMessage" select="$attrMessageBottom"/>
											<xsl:with-param name="messageStyle" select="MessageBottom"/>
										</xsl:call-template>
									</td>
								</tr>
							</xsl:if>
						</table>
					</td>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:if>
		
	</xsl:template>

	<xsl:template name="AttributeQuadrantBottom">
		<xsl:param name="attrId"/>
		<xsl:param name="VCSID"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:variable name="isLabelVisible"><xsl:choose><xsl:when test="$thisPage!='PF'"><xsl:value-of select="$CurrentAttributeXPath[@id=$attrId]/@labelVisible"/></xsl:when><xsl:otherwise><xsl:value-of select="'true'"/></xsl:otherwise></xsl:choose></xsl:variable>
		<xsl:variable name="IsOtherSelected">
			<xsl:if test="$subPage='API' ">
				<xsl:apply-templates mode="IsOtherSelected" select="Input">
					<xsl:with-param name="attrId" select="$attrId"/>
					<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
					<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
				</xsl:apply-templates>
			</xsl:if>
		</xsl:variable>
		<tr>
			<td>
				<xsl:apply-templates select="Input" mode="attributes">
					<xsl:with-param name="attrId" select="$attrId"/>
					<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
					<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
				</xsl:apply-templates>
				<xsl:if test="$IsOtherSelected = 'selected' ">
					<xsl:apply-templates mode="API.Other" select="$CurrentAttributeXPath/../../Other/Attribute[@id = $attrId]">
						<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
						<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
					</xsl:apply-templates>
				</xsl:if>
			</td>
		</tr>
		<tr>
			<td><xsl:choose><xsl:when test="$thisPage!='PF'"><xsl:attribute name="nowrap"><xsl:value-of select="'nowrap'"/></xsl:attribute></xsl:when><xsl:otherwise></xsl:otherwise></xsl:choose><xsl:choose>
					<xsl:when test="$CurrentAttributeXPath[@id=$attrId]">
						<xsl:apply-templates select="Label">
							<xsl:with-param name="attrId" select="$attrId"/>
							<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
						</xsl:apply-templates>
					</xsl:when>
					<xsl:when test="Label">&#160;</xsl:when>
					<xsl:otherwise></xsl:otherwise>
				</xsl:choose></td>
		</tr>
		<xsl:call-template name="AttributeError">
			<xsl:with-param name="InputId" select="$attrId"/>
			<xsl:with-param name="VCSID" select="$VCSID"/>
		</xsl:call-template>
	</xsl:template>

	<xsl:template name="AttributeQuadrantTop">
		<xsl:param name="attrId"/>
		<xsl:param name="VCSID"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:variable name="isLabelVisible"><xsl:choose><xsl:when test="$thisPage!='PF'"><xsl:value-of select="$CurrentAttributeXPath[@id=$attrId]/@labelVisible"/></xsl:when><xsl:otherwise><xsl:value-of select="'true'"/></xsl:otherwise></xsl:choose></xsl:variable>
		<xsl:variable name="IsOtherSelected">
			<xsl:if test="$subPage='API' ">
				<xsl:apply-templates mode="IsOtherSelected" select="Input">
					<xsl:with-param name="attrId" select="$attrId"/>
					<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
					<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
				</xsl:apply-templates>
			</xsl:if>
		</xsl:variable>
		<tr align="{@align}">
			<td valign="top">
			<!--<xsl:choose><xsl:when test="$thisPage!='PF'"><xsl:attribute name="nowrap"><xsl:value-of select="'nowrap'"/></xsl:attribute></xsl:when><xsl:otherwise></xsl:otherwise></xsl:choose>-->
			<xsl:choose>
					<xsl:when test="$CurrentAttributeXPath[@id=$attrId]">
						<xsl:apply-templates select="Label">
							<xsl:with-param name="attrId" select="$attrId"/>
							<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
						</xsl:apply-templates>
					</xsl:when>
					<xsl:when test="Label">&#160;</xsl:when>
					<xsl:otherwise></xsl:otherwise>
				</xsl:choose></td>
		</tr>
		<tr align="{@align}">
			<td>
				<xsl:apply-templates select="Input" mode="attributes">
					<xsl:with-param name="attrId" select="$attrId"/>
					<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
					<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
				</xsl:apply-templates>
				<xsl:if test="$IsOtherSelected = 'selected'">
					<xsl:apply-templates mode="API.Other" select="$CurrentAttributeXPath/../../Other/Attribute[@id = $attrId]">
						<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
						<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
					</xsl:apply-templates>
				</xsl:if>
			</td>
		</tr>
		<xsl:call-template name="AttributeError">
			<xsl:with-param name="InputId" select="$attrId"/>
			<xsl:with-param name="VCSID" select="$VCSID"/>
		</xsl:call-template>
	</xsl:template>
	<xsl:template name="AttributeQuadrantLeft">
		<xsl:param name="attrId"/>
		<xsl:param name="VCSID"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:variable name="isLabelVisible"><xsl:choose><xsl:when test="$thisPage!='PF'"><xsl:value-of select="$CurrentAttributeXPath[@id=$attrId]/@labelVisible"/></xsl:when><xsl:otherwise><xsl:value-of select="'true'"/></xsl:otherwise></xsl:choose></xsl:variable>
		<xsl:variable name="IsOtherSelected">
			<xsl:if test="$subPage='API' ">
				<xsl:apply-templates mode="IsOtherSelected" select="Input">
					<xsl:with-param name="attrId" select="$attrId"/>
					<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
					<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
				</xsl:apply-templates>
			</xsl:if>
		</xsl:variable>
		<tr align="{@align}">
			<td valign="middle"><xsl:choose><xsl:when test="$thisPage!='PF'"><xsl:attribute name="nowrap"><xsl:value-of select="'nowrap'"/></xsl:attribute></xsl:when><xsl:otherwise></xsl:otherwise></xsl:choose>
					<xsl:if test="$CurrentAttributeXPath[@id=$attrId]">
						<xsl:apply-templates select="Label">
							<xsl:with-param name="attrId" select="$attrId"/>
							<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
						</xsl:apply-templates>
					</xsl:if>&#160;</td>
		</tr>
		<tr align="{@align}">
			<td>
				<xsl:apply-templates select="Input" mode="attributes">
					<xsl:with-param name="attrId" select="$attrId"/>
					<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
					<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
				</xsl:apply-templates>
				<xsl:if test="$IsOtherSelected = 'selected'">
					<xsl:apply-templates mode="API.Other" select="$CurrentAttributeXPath/../../Other/Attribute[@id = $attrId]">
						<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
						<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
					</xsl:apply-templates>
				</xsl:if>
			</td>
		</tr>
		<xsl:call-template name="AttributeError">
			<xsl:with-param name="InputId" select="$attrId"/>
			<xsl:with-param name="VCSID" select="$VCSID"/>
			<xsl:with-param name="Col" select="'2'"/>
		</xsl:call-template>
	</xsl:template>
	<xsl:template name="AttributeQuadrantRight">
		<xsl:param name="attrId"/>
		<xsl:param name="VCSID"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:variable name="isLabelVisible"><xsl:choose><xsl:when test="$thisPage!='PF'"><xsl:value-of select="$CurrentAttributeXPath[@id=$attrId]/@labelVisible"/></xsl:when><xsl:otherwise><xsl:value-of select="'true'"/></xsl:otherwise></xsl:choose></xsl:variable>
		<xsl:variable name="IsOtherSelected">
			<xsl:if test="$subPage='API' ">
				<xsl:apply-templates mode="IsOtherSelected" select="Input">
					<xsl:with-param name="attrId" select="$attrId"/>
					<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
					<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
				</xsl:apply-templates>
			</xsl:if>
		</xsl:variable>
		<tr>
			<td align="{@align}">
				<xsl:apply-templates select="Input" mode="attributes">
					<xsl:with-param name="attrId" select="$attrId"/>
					<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
					<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
				</xsl:apply-templates>
				<xsl:if test="$IsOtherSelected = 'selected'">
					<xsl:apply-templates mode="API.Other" select="$CurrentAttributeXPath/../../Other/Attribute[@id = $attrId]">
						<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
						<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
					</xsl:apply-templates>
				</xsl:if>
			</td>
			<td valign="middle"><xsl:choose><xsl:when test="$thisPage!='PF'"><xsl:attribute name="nowrap"><xsl:value-of select="'nowrap'"/></xsl:attribute></xsl:when><xsl:otherwise></xsl:otherwise></xsl:choose><xsl:choose>
					<xsl:when test="$CurrentAttributeXPath[@id=$attrId]">
						<xsl:apply-templates select="Label">
							<xsl:with-param name="attrId" select="$attrId"/>
							<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
						</xsl:apply-templates>
				</xsl:when>
					<xsl:otherwise>&#160;</xsl:otherwise>
				</xsl:choose></td>
		</tr>
		<xsl:call-template name="AttributeError">
			<xsl:with-param name="InputId" select="$attrId"/>
			<xsl:with-param name="VCSID" select="$VCSID"/>
			<xsl:with-param name="Col" select="'2'"/>
		</xsl:call-template>
	</xsl:template>
	<xsl:template name="CheckboxRadio">
		<xsl:param name="attrId"/>
		<xsl:param name="columns"/>
		<xsl:param name="type"/>
		<xsl:param name="inputName"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:param name="VCSID"/>
		<table cellpadding="0" cellspacing="0" border="0">
			<xsl:variable name="syiParentAttrId" select="$CurrentAttributeXPath[Dependency/@childAttrId=$attrId]/@id"/>
			<xsl:variable name="syiParentValueId" select="$SelectedAttributeXPath[@id=$syiParentAttrId]/Value/@id[. = $CurrentAttributeXPath/Dependency[@childAttrId=$attrId]/@parentValueId]"/>
			<xsl:variable name="dependentAttrValues" select="$CurrentAttributeXPath[@id=$syiParentAttrId]/Dependency[@parentValueId=$syiParentValueId and @childAttrId=$attrId]/Value[count(. | key('attrByIDs', concat($VCSID, '_', key('selectedAttrByIDs', concat($VCSID, '_', ../../../@id, '_', ../@parentValueId))/@id, '_', @id))[1])=1]"/>
			<xsl:variable name="attrValues" select="$CurrentAttributeXPath[@id=$attrId]/ValueList/Value"/>
			<xsl:variable name="attrs" select="$attrValues[not($dependentAttrValues[@id != 0])] | $dependentAttrValues[@id != 0]"/>

			<xsl:for-each select="$attrs">
				<xsl:variable name="position" select="position()"/>
				<xsl:variable name="last" select="last()"/>
				<xsl:if test="(($position mod $columns) = 1) or $columns=1">
					<xsl:variable name="cols">
						<xsl:choose>
							<xsl:when test="$position + $columns &gt; $last">
								<xsl:value-of select="$last - $position + 1"/>
							</xsl:when>
							<xsl:otherwise>
								<xsl:value-of select="$columns"/>
							</xsl:otherwise>
						</xsl:choose>
					</xsl:variable>
					<tr>
						<xsl:call-template name="WidgetGroupTableCell">
							<xsl:with-param name="attrs" select="$attrs[position() &gt;= $position]"/>
							<xsl:with-param name="cols" select="$cols"/>
							<xsl:with-param name="max" select="$cols"/>
							<xsl:with-param name="inputName" select="$inputName"/>  
							<xsl:with-param name="attrId" select="$attrId"/>
							<xsl:with-param name="WidgetType" select="$type"/>
							<xsl:with-param name="IsEmpty" select="not($SelectedAttributeXPath[@id=$attrId]/Value)"/>
							<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
							<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
							<xsl:with-param name="VCSID" select="$VCSID"/>
							<xsl:with-param name="isDefault" select="@isDefault"/>
						</xsl:call-template>
						<!-- IF LAST ROW IS INCOMPLETE, FINISH IT -->
						<xsl:if test="((last()-position()) &lt; $columns) and ((last() mod $columns) != 0)">
							<td>
								<xsl:attribute name="colspan"><xsl:value-of select="$columns - (last() mod $columns)"/></xsl:attribute>
							</td>
						</xsl:if>
					</tr>
				</xsl:if>
			</xsl:for-each>
		</table>
	</xsl:template>
	<xsl:template name="WidgetGroupTableCell">
		<xsl:param name="attrs"/>
		<xsl:param name="cols"/>
		<xsl:param name="max"/>
		<!-- This template is used by radio buttons and check boxes. -->
		<xsl:param name="inputName"/>
		<xsl:param name="attrId"/>
		<xsl:param name="WidgetType"/>
		<xsl:param name="IsEmpty"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:param name="VCSID"/>
		<xsl:param name="isDefault"/>
		<xsl:variable name="gId" select="$max - $cols + 1" />
		<xsl:variable name="getattrId" select="$attrs[$gId]/../../@id"/>
		<xsl:variable name="getValueId" select="$attrs[$gId]/@id"/>
		<xsl:variable name="hasDisplayName" select="boolean($attrs[$gId]/DisplayName!='')"/>
		<!-- for multi-units: show 'DisplayName' is available, otherwise show 'Name'-->
		<xsl:variable name="WidgetName" select="$attrs[$gId]/DisplayName[$hasDisplayName] | $attrs[$gId]/Name[not($hasDisplayName)]"/>
		<xsl:variable name="IsDefault" select="$attrs[$gId]/IsDefault"/>
		<!-- DT...Need further refactoring once Dependencies are consistent -->
		<xsl:if test="$cols &gt; 0">
			<td valign="top">
				<xsl:choose>
					<xsl:when test="$thisPage='SYI'">
						<input type="{$WidgetType}" value="{$getValueId}">
							<xsl:choose>
								<xsl:when test="$subPage = 'API' and $CurrentAttributeXPath[@id=$attrId]/Dependency[@type='4' or @type='3' or type='5']">
									<xsl:attribute name="onClick">vvc_anyParent('attr<xsl:value-of select="concat($VCSID,'_',$attrId)"/>','attr<xsl:value-of select="$getValueId"/>');vvsp_check('attr<xsl:value-of select="concat($VCSID,'_',$attrId)"/>', this.value);</xsl:attribute>
								</xsl:when>
								<xsl:when test="$CurrentAttributeXPath[@id=$attrId]/Dependency[@type='1' or @type='2']">
									<xsl:attribute name="onClick">vvc_anyParent('attr<xsl:value-of select="concat($VCSID,'_',$attrId)"/>','attr<xsl:value-of select="$getValueId"/>');</xsl:attribute>
								</xsl:when>
								<xsl:when test="$subPage = 'API' and $getValueId ='-6' ">
									<xsl:attribute name="onClick">api_check_on_other('attr<xsl:value-of select="concat($VCSID,'_',$attrId)"/>',-6);</xsl:attribute>
								</xsl:when>
								<xsl:otherwise/>
							</xsl:choose>
							<xsl:variable name="FieldName" select="concat('attr',$VCSID,'_',$attrId)"/>
							<xsl:if test="($UsePostedFormFields and $getValueId = $FormFields/FormField[@name = $FieldName]/Value) or $SelectedAttributeXPath[@id=$getattrId]/Value[@id=$getValueId] or ($IsEmpty and $IsDefault) or $subPage='API' and $SelectedAttributeXPath[@id=$attrId]/Value[@id=$getValueId] ">
								<xsl:attribute name="checked">checked</xsl:attribute>
							</xsl:if>
							<xsl:choose>
								<xsl:when test="$SelectedAttributeXPath[@id=$getattrId]/@mvs or $SelectedAttributeXPath[@id=$getattrId]//Value[@id=$getValueId]/@mvs">
									<xsl:choose>
										<xsl:when test="$WidgetType='checkbox'">
											<xsl:attribute name="name"><xsl:value-of select="$FieldName"/>_mvs</xsl:attribute>
											<xsl:attribute name="id"><xsl:value-of select="$FieldName"/></xsl:attribute>
											<xsl:attribute name="checked">checked</xsl:attribute>
											<xsl:attribute name="style">font: italic; color: Gray; background: Silver;</xsl:attribute>
											<xsl:attribute name="onClick">if(this.name.indexOf('_mvs')>0){this.style.background=document.bgColor;this.name=this.name.substring(0,this.name.length-4);}</xsl:attribute>
											<xsl:attribute name="onKeyPress">if(this.name.indexOf('_mvs')>0){this.style.background=document.bgColor;this.name=this.name.substring(0,this.name.length-4);}</xsl:attribute>
										</xsl:when>
										<xsl:otherwise>
											<xsl:attribute name="name"><xsl:value-of select="$FieldName"/></xsl:attribute>
										</xsl:otherwise>
									</xsl:choose>
								</xsl:when>
								<xsl:otherwise>
									<xsl:attribute name="name"><xsl:value-of select="$FieldName"/></xsl:attribute>
								</xsl:otherwise>
							</xsl:choose>
						</input>
						<xsl:text> </xsl:text>
						<xsl:variable name="ValueLabelStyle" select="$CurrentAttributeXPath/../../../PresentationInstruction/*/Row/Widget/Attribute[@id = $attrId]/*[name() ='Label' or name() = 'Input' ]"/>
						<font size="2" face="Verdana,Geneva,Arial,Helvetica">
							<xsl:copy-of select="$ValueLabelStyle/@*"/>
							<xsl:choose>
								<xsl:when test="$ValueLabelStyle/@bold='true' and @italic='true'">
									<b>
										<i>
											<xsl:value-of select="$WidgetName"/>
										</i>
									</b>
								</xsl:when>
								<xsl:when test="$ValueLabelStyle/@bold='true'">
									<b>
										<xsl:value-of select="$WidgetName"/>
									</b>
								</xsl:when>
								<xsl:when test="$ValueLabelStyle/@italic='true'">
									<i>
										<xsl:value-of select="$WidgetName"/>
									</i>
								</xsl:when>
								<xsl:otherwise>
									<xsl:value-of select="$WidgetName"/>
								</xsl:otherwise>
							</xsl:choose>
						</font>
					</xsl:when>
					<xsl:otherwise>
						<xsl:variable name="pfId" select="$CurrentAttributeXPath[@id=$attrId]/InputFields/Input/Value/@pfId"/>
						<xsl:variable name="pfPageType" select="$CurrentAttributeXPath[@id=$attrId]/InputFields/Input/Value/@pfPageType"/>
						<input type="{$WidgetType}" value="{$getValueId}">
							<!-- VVC or VVP  -->
							<xsl:if test="$CurrentAttributeXPath[@id=$attrId]/Dependency[@type='1' or @type='2']">
								<xsl:attribute name="onClick">vvc_anyParent('a<xsl:value-of select="$attrId"/>','a<xsl:value-of select="$getValueId"/>');</xsl:attribute>
							</xsl:if>
							<!-- Default values for PF are contained inside InputFields element.  There's no IsDefault element for PF....there is now for 1.5  -->
							<xsl:choose>
								<xsl:when test="$pfId and $pfPageType and $isDefault='true'">
									<xsl:attribute name="checked">checked</xsl:attribute>
								</xsl:when>
								<xsl:otherwise>
									<xsl:if test="$SelectedAttributeXPath[@id=$attrId]/InputFields/Input/Value[@id=$getValueId]">
										<xsl:attribute name="checked">checked</xsl:attribute>
									</xsl:if>
								</xsl:otherwise>
							</xsl:choose>
							<xsl:attribute name="name"><xsl:value-of select="$inputName"/></xsl:attribute>
						</input>
					</xsl:otherwise>
				</xsl:choose>
			</td>
			<xsl:if test="$thisPage='SYI'"><td width="10">&#160;</td></xsl:if>
			<xsl:if test="$thisPage='PF'"><td valign="top"><img src="http://pics.ebaystatic.com/aw/pics/spacer.gif" height="3" width="1" alt=""/><br/><font face="{$thisPI[@id=$attrId]/Input/@face}" size="{$thisPI[@id=$attrId]/Input/@size}" color="{$thisPI[@id=$attrId]/Input/@color}"><xsl:value-of select="$WidgetName"/></font></td></xsl:if>
			<xsl:call-template name="WidgetGroupTableCell">
				<xsl:with-param name="attrs" select="$attrs"/>
				<xsl:with-param name="cols" select="$cols - 1"/>
				<xsl:with-param name="max" select="$max"/>
				<xsl:with-param name="inputName" select="$inputName"/>
				<xsl:with-param name="attrId" select="$attrId"/>
				<xsl:with-param name="WidgetType" select="$WidgetType"/>
				<xsl:with-param name="IsEmpty" select="$IsEmpty"/>
				<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
				<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
				<xsl:with-param name="VCSID" select="$VCSID"/>
				<xsl:with-param name="isDefault" select="following-sibling::Value/@isDefault"/>
			</xsl:call-template>
		</xsl:if>
	</xsl:template>
	<xsl:template name="date_options">
		<xsl:param name="format"/>
		<xsl:param name="date_part"/>
		<!-- REQUIRED: 'Day' | 'Month' | 'Year' -->
		<xsl:param name="attr_id"/>
		<!-- REQUIRED -->
		<xsl:param name="date_sort"/>
		<!-- REQUIRED FOR DAYS AND MONTHS: 'DayAscending' | 'DayDescending' | ... etc ... -->
		<xsl:param name="pi_node_set"/>
		<!-- REQUIRED FOR YEARS: options definded in the PI -->
		<xsl:param name="range_type"/>
		<!-- OPTIONAL: only needed for PF date ranges -->
		<xsl:param name="FieldName"/>
		<!-- OPTIONAL: only needed for SYI (to pull data from PostedFormFields section -->
		<xsl:param name="SelectedAttributeXPath"/>
		<!-- OPTIONAL: Needed for SYI when Listing in 2 categories -->
		<xsl:param name="VCSID"/>
		<!-- GET THE DEFAULT DATE -->
		<xsl:variable name="default_val">
			<xsl:call-template name="get_default_val">
				<xsl:with-param name="date_part" select="$date_part"/>
				<xsl:with-param name="attr_id" select="$attr_id"/>
				<xsl:with-param name="range_type" select="$range_type"/>
				<xsl:with-param name="FieldName" select="$FieldName"/>
				<xsl:with-param name="VCSID" select="$VCSID"/>
				<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
			</xsl:call-template>
		</xsl:variable>
		
		<!-- GET SPECIFIC DATE STRINGS -->
		<xsl:variable name="primary_match">
			<xsl:choose>
				<xsl:when test="$pi_node_set"><xsl:value-of select="$pi_node_set"/></xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="get_date_strings">
						<xsl:with-param name="date_sort" select="$date_sort"/>
						<xsl:with-param name="date_part" select="$date_part"/>
						<xsl:with-param name="match" select=" 'primary' "/>
					</xsl:call-template>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="date_text">
			<xsl:choose>
				<xsl:when test="$pi_node_set"><xsl:value-of select="$pi_node_set"/></xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="get_date_strings">
						<xsl:with-param name="date_sort" select="$date_sort"/>
						<xsl:with-param name="date_part" select="$date_part"/>
						<xsl:with-param name="format" select="$format"/>
						<!--<xsl:with-param name="match" select=" 'text' "/>-->
					</xsl:call-template>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		
		<!-- CREATE THE DATE OPTIONS -->
		<xsl:if test="not($pi_node_set)">
			<xsl:choose>
				<xsl:when test="$thisPage='PF'"><option value="-24"></option></xsl:when>
				<xsl:otherwise><option value="-10">--</option></xsl:otherwise>
			</xsl:choose>
		</xsl:if>
		<xsl:call-template name="create_date_options">
			<xsl:with-param name="attr_id" select="$attr_id"/>
			<xsl:with-param name="default_val" select="$default_val"/>
			<xsl:with-param name="primary_match" select="$primary_match"/>
			<xsl:with-param name="date_text" select="$date_text"/>
			<xsl:with-param name="delim" select=" ';' "/>
			<xsl:with-param name="VCSID" select="$VCSID"/>
			<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
		</xsl:call-template>
		<!--This is for Value Carry Forward.  If the value in the inputfield of this attribute is not present in the Years node set, then add it to the bottom of the dropdown and make it selected -->
		<xsl:if test="$date_part='Year'">
		<xsl:variable name="vcf_year" select="$returnAttr[@id=$attr_id]/InputFields/Input[@dataType='Y' and @rangeType=$range_type]/Value/Name"/>
			<xsl:if test="contains($pi_node_set,$vcf_year)=false() and $vcf_year!='-24'">
				<option value="{$returnAttr[@id=$attr_id]/InputFields/Input[@dataType='Y' and @rangeType=$range_type]/Value/Name}" selected="selected">
					<xsl:value-of select="$returnAttr[@id=$attr_id]/InputFields/Input[@dataType='Y' and @rangeType=$range_type]/Value/Name"/>
				</option>				
			</xsl:if>
		</xsl:if>
	</xsl:template>
	<xsl:template name="create_date_options">
		<xsl:param name="attr_id"/>
		<xsl:param name="default_val"/>
		<xsl:param name="primary_match"/>
		<xsl:param name="date_text"/>
		<xsl:param name="delim" select=" ';' "/>
		<xsl:param name="VCSID"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<!-- GET THE NEXT SUBSTRING -->
		<xsl:variable name="primary" select="substring-before($primary_match,$delim)"/>
		<xsl:variable name="text" select="substring-before($date_text,$delim)"/>
		<!-- WRITE THE OPTIONS -->
		<xsl:choose>
			<xsl:when test="$thisPage='PF'">
				<option>
					<xsl:attribute name="value"><xsl:choose><xsl:when test="$primary='--' or $primary='Any' or $primary=''">-24</xsl:when><xsl:otherwise><xsl:value-of select="$primary"/></xsl:otherwise></xsl:choose></xsl:attribute>
					<xsl:if test="number($default_val) = number($primary)">
						<xsl:attribute name="selected">selected</xsl:attribute>
					</xsl:if>
					<xsl:value-of select="$text"/>
				</option>
			</xsl:when>
			<xsl:otherwise>
				<option>
					<xsl:attribute name="value"><xsl:choose><xsl:when test="$primary='-' or $primary='--' or $primary='Any' or $primary=''">-10</xsl:when><xsl:otherwise><xsl:value-of select="$primary"/></xsl:otherwise></xsl:choose></xsl:attribute>
					<xsl:if test="number($default_val) = number($primary)">
						<xsl:attribute name="selected">selected</xsl:attribute>
					</xsl:if>
					<xsl:value-of select="$text"/>
				</option>
			</xsl:otherwise>
		</xsl:choose>
		<!-- RECURSION, IF THERE ARE MORE SUBSTRINGS -->
		<xsl:if test="string-length(substring-after($primary_match,$delim)) &gt; 0">
			<xsl:call-template name="create_date_options">
				<xsl:with-param name="attr_id" select="$attr_id"/>
				<xsl:with-param name="default_val" select="$default_val"/>
				<xsl:with-param name="primary_match" select="substring-after($primary_match,$delim)"/>
				<xsl:with-param name="date_text" select="substring-after($date_text,$delim)"/>
				<xsl:with-param name="delim" select="$delim"/>
				<xsl:with-param name="VCSID" select="$VCSID"/>
				<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
			</xsl:call-template>
		</xsl:if>
	</xsl:template>
	<xsl:template name="get_default_val">
		<xsl:param name="date_part"/>
		<xsl:param name="attr_id"/>
		<xsl:param name="range_type"/>
		<xsl:param name="FieldName"/>
		<xsl:param name="VCSID"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:variable name="pi" select="$thisPI[@id=$attr_id]"/>
		<!-- GET THE POSSIBLE DEFAULT VALUES -->
		<xsl:variable name="users_val">
			<xsl:choose>
				<xsl:when test="$thisPage!='PF'">
					<xsl:choose>
						<xsl:when test="$UsePostedFormFields">
							<xsl:value-of select="$FormFields/FormField[@name = $FieldName]/Value"/>
						</xsl:when>
						<!-- ms: the following case can probably be removed for API -->
						<xsl:when test="$returnAttr[../@id=$VCSID and @id=$attr_id]/Value/*[name() = $date_part] != ''">
							<xsl:value-of select="$returnAttr[../@id=$VCSID and @id=$attr_id]/Value/*[name() = $date_part]"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$SelectedAttributeXPath[@id=$attr_id]/Value/*[name() = $date_part]"/>
						</xsl:otherwise>
					</xsl:choose>					
				</xsl:when>
				<xsl:when test="$subPage='API'">
					<xsl:choose>
						<!-- ms: the following case can probably be removed for API -->
						<xsl:when test="$returnAttr[../@id=$VCSID and @id=$attr_id]/Value/*[name() = $date_part] != ''">
							<xsl:value-of select="$returnAttr[../@id=$VCSID and @id=$attr_id]/Value/*[name() = $date_part]"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$SelectedAttributeXPath[@id=$attr_id]/Value/*[name() = $date_part]"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<xsl:when test="$range_type!=''">
					<xsl:value-of select="$returnAttr[@id=$attr_id]/InputFields/Input[@dataType=substring($date_part,1,1) and @rangeType=$range_type]/Value/Name" />
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="$returnAttr[@id=$attr_id]/InputFields/Input[@dataType=substring($date_part,1,1)]/Value/Name" />
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="current_val">
			<xsl:if test="$pi/CurrentDate">
				<xsl:call-template name="get_current_date_string">
					<xsl:with-param name="date_part" select="$date_part"/>
					<xsl:with-param name="date" select="$attrData[@id=$attr_id]/CurrentTime/DateMedium"/>
				</xsl:call-template>
			</xsl:if>
		</xsl:variable>
		<xsl:variable name="initial_val">
			<xsl:choose>
				<xsl:when test="$date_part = 'Day'"><xsl:value-of select="$pi/DayInitialValue"/></xsl:when>
				<xsl:when test="$date_part = 'Month'"><xsl:value-of select="$pi/MonthInitialValue"/></xsl:when>
				<xsl:when test="$date_part = 'Year'"><xsl:value-of select="$pi/YearInitialValue"/></xsl:when>
			</xsl:choose>
		</xsl:variable>
		<!-- RETURN THE RIGHT DEFAULT VALUE -->
		<xsl:choose>
			<xsl:when test="string-length($users_val) &gt; 0">
				<xsl:value-of select="$users_val"/>
			</xsl:when>
			<xsl:when test="string-length($current_val) &gt; 0">
				<xsl:value-of select="$current_val"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$initial_val"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template name="get_current_date_string">
		<xsl:param name="date_part"/>
		<xsl:param name="date"/>
		<xsl:variable name="Delim">
			<xsl:choose>
				<xsl:when test="contains($date,'-')"><xsl:value-of select="'-'"/></xsl:when>
				<xsl:when test="contains($date,'.')"><xsl:value-of select="'.'"/></xsl:when>
				<xsl:when test="contains($date,'/')"><xsl:value-of select="'/'"/></xsl:when>
				<xsl:when test="contains($date,'_')"><xsl:value-of select="'_'"/></xsl:when>
				<xsl:when test="contains($date,',')"><xsl:value-of select="','"/></xsl:when>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="month" select="substring-before($date,$Delim)"/>
		<xsl:variable name="day_year" select="substring-after($date,$Delim)"/>
		<xsl:variable name="day" select="substring-before($day_year,$Delim)"/>
		<xsl:variable name="year" select="substring-after($day_year,$Delim)"/>
		<xsl:choose>
			<xsl:when test="$date_part = 'Day'"><xsl:value-of select="$day"/></xsl:when>
			<xsl:when test="$date_part = 'Month'"><xsl:value-of select="$month"/></xsl:when>
			<xsl:when test="$date_part = 'Year' and $year"><xsl:value-of select=" concat('20',$year) "/></xsl:when>
		</xsl:choose>
	</xsl:template>
	<xsl:template name="get_date_strings">
		<xsl:param name="format"/>
		<xsl:param name="date_sort"/>
		<xsl:param name="date_part"/>
		<xsl:param name="match"/>
		
		<!-- ALL THE POSSIBLE DATE STRINGS -->
		<xsl:variable name="day_ascending">01;02;03;04;05;06;07;08;09;10;11;12;13;14;15;16;17;18;19;20;21;22;23;24;25;26;27;28;29;30;31;</xsl:variable>
		<xsl:variable name="day_descending">31;30;29;28;27;26;25;24;23;22;21;20;19;18;17;16;15;14;13;12;11;10;09;08;07;06;05;04;03;02;01;</xsl:variable>
		<xsl:variable name="month_ascending_short">Jan;Feb;Mar;Apr;May;Jun;Jul;Aug;Sep;Oct;Nov;Dec;</xsl:variable>
		<xsl:variable name="month_descending_short">Dec;Nov;Oct;Sep;Aug;Jul;Jun;May;Apr;Mar;Feb;Jan;</xsl:variable>

		<xsl:variable name="month_ascending_number">01;02;03;04;05;06;07;08;09;10;11;12;</xsl:variable>
		<xsl:variable name="month_descending_number">12;11;10;09;08;07;06;05;04;03;02;01;</xsl:variable>
		
		<!-- LOGIC FOR RETURNING DATE STRINGS -->
		<xsl:choose>
			<xsl:when test=" $date_part = 'Day' ">
				<xsl:choose>
					<xsl:when test=" $date_sort = 'descending' ">
						<xsl:value-of select="$day_descending"/>
					</xsl:when>
					<xsl:when test=" $date_sort = 'ascending' ">
						<xsl:value-of select="$day_ascending"/>
					</xsl:when>
				</xsl:choose>
			</xsl:when>
			<xsl:when test=" $date_part = 'Month' ">
				<xsl:choose>
					<xsl:when test="($date_sort = 'ascending') and contains($format,'M')">
						<xsl:call-template name="month_ascending_short"/>
					</xsl:when>
					<xsl:when test="($date_sort = 'descending') and contains($format,'M')">
						<xsl:call-template name="month_descending_short"/>
					</xsl:when>
					<xsl:when test="($date_sort = 'ascending') and  $match = 'primary' ">
							<xsl:value-of select="$month_ascending_number"/>
					</xsl:when>
					<xsl:when test="($date_sort = 'descending') and  $match = 'primary' ">
							<xsl:value-of select="$month_descending_number"/>
					</xsl:when>
					<xsl:when test="($date_sort = 'ascending') and contains($format,'m')">
						<xsl:value-of select="$month_ascending_number"/>
					</xsl:when>
					<xsl:when test="($date_sort = 'descending') and contains($format,'m')">
						<xsl:value-of select="$month_descending_number"/>
					</xsl:when>
				</xsl:choose>
			</xsl:when>
		</xsl:choose>
	</xsl:template>
	
	<xsl:template name="month_ascending_short">
		<xsl:choose>
			<xsl:when test="$subPage = 'API' and /eBay/GlobalSettings/MonthAscendingShort"><xsl:value-of select="/eBay/GlobalSettings/MonthAscendingShort"/></xsl:when>
			<xsl:otherwise>Jan<xsl:value-of select="';'"/>Feb<xsl:value-of select="';'"/>Mar<xsl:value-of select="';'"/>Apr<xsl:value-of select="';'"/>May<xsl:value-of select="';'"/>Jun<xsl:value-of select="';'"/>Jul<xsl:value-of select="';'"/>Aug<xsl:value-of select="';'"/>Sep<xsl:value-of select="';'"/>Oct<xsl:value-of select="';'"/>Nov<xsl:value-of select="';'"/>Dec<xsl:value-of select="';'"/></xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template name="month_descending_short">
		<xsl:choose>
			<xsl:when test="$subPage = 'API' and /eBay/GlobalSettings/MonthDescendingShort "><xsl:value-of select="/eBay/GlobalSettings/MonthDescendingShort"/></xsl:when>
			<xsl:otherwise>Dec<xsl:value-of select="';'"/>Nov<xsl:value-of select="';'"/>Oct<xsl:value-of select="';'"/>Sep<xsl:value-of select="';'"/>Aug<xsl:value-of select="';'"/>Jul<xsl:value-of select="';'"/>Jun<xsl:value-of select="';'"/>May<xsl:value-of select="';'"/>Apr<xsl:value-of select="';'"/>Mar<xsl:value-of select="';'"/>Feb<xsl:value-of select="';'"/>Jan<xsl:value-of select="';'"/></xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template name="month_ascending_long">
		<xsl:choose>
			<xsl:when test="$subPage = 'API' and /eBay/GlobalSettings/MonthDescendingLong"><xsl:value-of select="/eBay/GlobalSettings/MonthDescendingShort"/></xsl:when>
			<xsl:otherwise>January<xsl:value-of select="';'"/>February<xsl:value-of select="';'"/>March<xsl:value-of select="';'"/>April<xsl:value-of select="';'"/>May<xsl:value-of select="';'"/>June<xsl:value-of select="';'"/>July<xsl:value-of select="';'"/>August<xsl:value-of select="';'"/>September<xsl:value-of select="';'"/>October<xsl:value-of select="';'"/>November<xsl:value-of select="';'"/>December<xsl:value-of select="';'"/></xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template name="month_descending_long">
		<xsl:choose>
			<xsl:when test="$subPage = 'API' and /eBay/GlobalSettings/MonthDescendingLong"><xsl:value-of select="/eBay/GlobalSettings/MonthDescendingShort"/></xsl:when>
			<xsl:otherwise>December<xsl:value-of select="';'"/>November<xsl:value-of select="';'"/>October<xsl:value-of select="';'"/>September<xsl:value-of select="';'"/>August<xsl:value-of select="';'"/>July<xsl:value-of select="';'"/>June<xsl:value-of select="';'"/>May<xsl:value-of select="';'"/>April<xsl:value-of select="';'"/>March<xsl:value-of select="';'"/>February<xsl:value-of select="';'"/>January<xsl:value-of select="';'"/></xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template name="date_options_old">
		<xsl:param name="date_part"/>
		<!-- REQUIRED: 'Day' | 'Month' | 'Year' -->
		<xsl:param name="attr_id"/>
		<!-- REQUIRED -->
		<xsl:param name="date_sort"/>
		<!-- REQUIRED FOR DAYS AND MONTHS: 'DayAscending' | 'DayDescending' | ... etc ... -->
		<xsl:param name="pi_node_set"/>
		<!-- REQUIRED FOR YEARS: options definded in the PI -->
		<xsl:param name="range_type"/>
		<!-- OPTIONAL: only needed for PF date ranges -->
		<xsl:param name="FieldName"/>
		<!-- OPTIONAL: only needed for SYI (to pull data from PostedFormFields section -->
		<xsl:param name="SelectedAttributeXPath"/>
		<!-- OPTIONAL: Needed for SYI when Listing in 2 categories -->
		<xsl:param name="VCSID"/>
		<!-- GET THE DEFAULT DATE -->
		<xsl:variable name="default_val">
			<xsl:call-template name="get_default_val_old">
				<xsl:with-param name="date_part" select="$date_part"/>
				<xsl:with-param name="attr_id" select="$attr_id"/>
				<xsl:with-param name="range_type" select="$range_type"/>
				<xsl:with-param name="FieldName" select="$FieldName"/>
				<xsl:with-param name="VCSID" select="$VCSID"/>
			</xsl:call-template>
		</xsl:variable>
		<!-- GET SPECIFIC DATE STRINGS -->
		<xsl:variable name="primary_match">
			<xsl:choose>
				<xsl:when test="$pi_node_set">
					<xsl:value-of select="$pi_node_set"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="get_date_strings_old">
						<xsl:with-param name="date_sort" select="$date_sort"/>
						<xsl:with-param name="date_part" select="$date_part"/>
						<xsl:with-param name="match" select=" 'primary' "/>
					</xsl:call-template>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="secondary_match">
			<xsl:choose>
				<xsl:when test="$pi_node_set">
					<xsl:value-of select="$pi_node_set"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="get_date_strings_old">
						<xsl:with-param name="date_sort" select="$date_sort"/>
						<xsl:with-param name="date_part" select="$date_part"/>
						<xsl:with-param name="match" select=" 'secondary' "/>
					</xsl:call-template>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="date_text">
			<xsl:choose>
				<xsl:when test="$pi_node_set">
					<xsl:value-of select="$pi_node_set"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="get_date_strings_old">
						<xsl:with-param name="date_sort" select="$date_sort"/>
						<xsl:with-param name="date_part" select="$date_part"/>
						<xsl:with-param name="match" select=" 'text' "/>
					</xsl:call-template>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<!-- CREATE THE DATE OPTIONS -->
		<xsl:if test="not($pi_node_set)">
			<xsl:choose>
				<xsl:when test="$thisPage='PF'">
					<option value="-24"/>
				</xsl:when>
				<xsl:otherwise>
					<option value="-10">--</option>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:if>
		<xsl:call-template name="create_date_options_old">
			<xsl:with-param name="attr_id" select="$attr_id"/>
			<xsl:with-param name="default_val" select="$default_val"/>
			<xsl:with-param name="primary_match" select="$primary_match"/>
			<xsl:with-param name="secondary_match" select="$secondary_match"/>
			<xsl:with-param name="date_text" select="$date_text"/>
			<xsl:with-param name="delim" select=" ';' "/>
			<xsl:with-param name="VCSID" select="$VCSID"/>
			<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
		</xsl:call-template>
		<!--This is for Value Carry Forward.  If the value in the inputfield of this attribute is not present in the Years node set, then add it to the bottom of the dropdown and make it selected -->
		<xsl:if test="$date_part='Year'">
		<xsl:variable name="vcf_year" select="$returnAttr[@id=$attr_id]/InputFields/Input[@dataType='Y' and @rangeType=$range_type]/Value/Name"/>
			<xsl:if test="contains($pi_node_set,$vcf_year)=false() and $vcf_year!='-24'">
				<option value="{$returnAttr[@id=$attr_id]/InputFields/Input[@dataType='Y' and @rangeType=$range_type]/Value/Name}" selected="selected">
					<xsl:value-of select="$returnAttr[@id=$attr_id]/InputFields/Input[@dataType='Y' and @rangeType=$range_type]/Value/Name"/>
				</option>				
			</xsl:if>
		</xsl:if>
	</xsl:template>
	<xsl:template name="create_date_options_old">
		<xsl:param name="attr_id"/>
		<xsl:param name="default_val"/>
		<xsl:param name="primary_match"/>
		<xsl:param name="secondary_match"/>
		<xsl:param name="date_text"/>
		<xsl:param name="delim" select=" ';' "/>
		<xsl:param name="VCSID"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<!-- GET THE NEXT SUBSTRING -->
		<xsl:variable name="primary" select="substring-before($primary_match,$delim)"/>
		<xsl:variable name="secondary" select="substring-before($secondary_match,$delim)"/>
		<xsl:variable name="text" select="substring-before($date_text,$delim)"/>
		<!-- WRITE THE OPTIONS -->
		<xsl:choose>
			<xsl:when test="$thisPage='PF'">
				<option>
					<xsl:attribute name="value"><xsl:choose><xsl:when test="$primary='--' or $primary='Any' or $primary=''">-24</xsl:when><xsl:otherwise><xsl:value-of select="$primary"/></xsl:otherwise></xsl:choose></xsl:attribute>
					<xsl:if test="number($default_val) = number($primary) or number($default_val) = number($secondary)">
						<xsl:attribute name="selected">selected</xsl:attribute>
					</xsl:if>
					<xsl:value-of select="$text"/>
				</option>
			</xsl:when>
			<xsl:otherwise>
				<option>
					<xsl:attribute name="value"><xsl:choose><xsl:when test="$primary='--' or $primary='Any' or $primary=''">-10</xsl:when><xsl:otherwise><xsl:value-of select="$primary"/></xsl:otherwise></xsl:choose></xsl:attribute>
					<xsl:if test="(number($default_val) = number($primary) or number($default_val) = number($secondary)) and $SelectedAttributeXPath[@id=$attr_id]">
						<xsl:attribute name="selected">selected</xsl:attribute>
					</xsl:if>
					<xsl:value-of select="$text"/>
				</option>
			</xsl:otherwise>
		</xsl:choose>
		<!-- RECURSION, IF THERE ARE MORE SUBSTRINGS -->
		<xsl:if test="string-length(substring-after($primary_match,$delim)) &gt; 0">
			<xsl:call-template name="create_date_options_old">
				<xsl:with-param name="attr_id" select="$attr_id"/>
				<xsl:with-param name="default_val" select="$default_val"/>
				<xsl:with-param name="primary_match" select="substring-after($primary_match,$delim)"/>
				<xsl:with-param name="secondary_match" select="substring-after($secondary_match,$delim)"/>
				<xsl:with-param name="date_text" select="substring-after($date_text,$delim)"/>
				<xsl:with-param name="delim" select="$delim"/>
				<xsl:with-param name="VCSID" select="$VCSID"/>
				<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
			</xsl:call-template>
		</xsl:if>
	</xsl:template>
	<xsl:template name="get_default_val_old">
		<xsl:param name="date_part"/>
		<xsl:param name="attr_id"/>
		<xsl:param name="range_type"/>
		<xsl:param name="FieldName"/>
		<xsl:param name="VCSID"/>
		<xsl:variable name="pi" select="$thisPI[@id=$attr_id]"/>
		<!-- GET THE POSSIBLE DEFAULT VALUES -->
		<xsl:variable name="users_val">
			<xsl:choose>
				<xsl:when test="$thisPage!='PF'">
					<xsl:choose>
						<xsl:when test="$UsePostedFormFields">
							<xsl:value-of select="$FormFields/FormField[@name = $FieldName]/Value"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$returnAttr[@id=$attr_id and ../@id=$VCSID]/Value/*[name() = $date_part]"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<xsl:when test="$subPage='API'">
					<xsl:value-of select="$returnAttr[@id=$attr_id]/Value/*[name() = $date_part]"/>
				</xsl:when>
				<xsl:when test="$range_type!=''">
					<xsl:value-of select="$returnAttr[@id=$attr_id]/InputFields/Input[@dataType=substring($date_part,1,1) and @rangeType=$range_type]/Value/Name"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="$returnAttr[@id=$attr_id]/InputFields/Input[@dataType=substring($date_part,1,1)]/Value/Name"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="current_val">
			<xsl:if test="$pi/CurrentDate">
				<xsl:call-template name="get_current_date_string_old">
					<xsl:with-param name="date_part" select="$date_part"/>
					<xsl:with-param name="date" select="$attrData[@id=$attr_id]/CurrentTime/DateMedium"/>
				</xsl:call-template>
			</xsl:if>
		</xsl:variable>
		<xsl:variable name="initial_val">
			<xsl:choose>
				<xsl:when test="$date_part = 'Day'">
					<xsl:value-of select="$pi/DayInitialValue"/>
				</xsl:when>
				<xsl:when test="$date_part = 'Month'">
					<xsl:value-of select="$pi/MonthInitialValue"/>
				</xsl:when>
				<xsl:when test="$date_part = 'Year'">
					<xsl:value-of select="$pi/YearInitialValue"/>
				</xsl:when>
			</xsl:choose>
		</xsl:variable>
		<!-- RETURN THE RIGHT DEFAULT VALUE -->
		<xsl:choose>
			<xsl:when test="string-length($users_val) &gt; 0">
				<xsl:value-of select="$users_val"/>
			</xsl:when>
			<xsl:when test="string-length($current_val) &gt; 0">
				<xsl:value-of select="$current_val"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$initial_val"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template name="get_current_date_string_old">
		<xsl:param name="date_part"/>
		<xsl:param name="date"/>
		<xsl:variable name="month" select="substring-before($date,'-')"/>
		<xsl:variable name="day_year" select="substring-after($date,'-')"/>
		<xsl:variable name="day" select="substring-before($day_year,'-')"/>
		<xsl:variable name="year" select="substring-after($day_year,'-')"/>
		<xsl:choose>
			<xsl:when test="$date_part = 'Day'">
				<xsl:value-of select="$day"/>
			</xsl:when>
			<xsl:when test="$date_part = 'Month'">
				<xsl:value-of select="$month"/>
			</xsl:when>
			<xsl:when test="$date_part = 'Year' and $year">
				<xsl:value-of select=" concat('20',$year) "/>
			</xsl:when>
		</xsl:choose>
	</xsl:template>
	<xsl:template name="get_date_strings_old">
		<xsl:param name="date_sort"/>
		<xsl:param name="date_part"/>
		<xsl:param name="match"/>
		<!-- ALL THE POSSIBLE DATE STRINGS -->
		<xsl:variable name="day_ascending">01;02;03;04;05;06;07;08;09;10;11;12;13;14;15;16;17;18;19;20;21;22;23;24;25;26;27;28;29;30;31;</xsl:variable>
		<xsl:variable name="day_descending">31;30;29;28;27;26;25;24;23;22;21;20;19;18;17;16;15;14;13;12;11;10;09;08;07;06;05;04;03;02;01;</xsl:variable>
		<xsl:variable name="month_ascending_short">
			<xsl:choose>
				<xsl:when test="$subPage = 'API' and /eBay/GlobalSettings/MonthAscendingShort"><xsl:value-of select="/eBay/GlobalSettings/MonthAscendingShort"/></xsl:when>
				<xsl:otherwise>Jan;Feb;Mar;Apr;May;Jun;Jul;Aug;Sep;Oct;Nov;Dec;</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="month_descending_short">
			<xsl:choose>
				<xsl:when test="$subPage = 'API' and /eBay/GlobalSettings/MonthDescendingShort"><xsl:value-of select="/eBay/GlobalSettings/MonthDescendingShort"/></xsl:when>
				<xsl:otherwise>Dec;Nov;Oct;Sep;Aug;Jul;Jun;May;Apr;Mar;Feb;Jan;</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="month_ascending_long">
			<xsl:choose>
				<xsl:when test="$subPage = 'API' and /eBay/GlobalSettings/MonthAscendingLong"><xsl:value-of select="/eBay/GlobalSettings/MonthAscendingLong"/></xsl:when>
				<xsl:otherwise>Jan;Feb;Mar;Apr;May;Jun;Jul;Aug;Sep;Oct;Nov;Dec;</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="month_descending_long">
			<xsl:choose>
				<xsl:when test="$subPage = 'API' and /eBay/GlobalSettings/MonthDescendingLong"><xsl:value-of select="/eBay/GlobalSettings/MonthDescendingLong"/></xsl:when>
				<xsl:otherwise>Dec;Nov;Oct;Sep;Aug;Jul;Jun;May;Apr;Mar;Feb;Jan;</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="month_ascending_number">01;02;03;04;05;06;07;08;09;10;11;12;</xsl:variable>
		<xsl:variable name="month_descending_number">12;11;10;09;08;07;06;05;04;03;02;01;</xsl:variable>
		<xsl:variable name="year_ascending">2001;2002;2003;2004;2005;2006;</xsl:variable>
		<xsl:variable name="year_descending">2006;2005;2004;2003;2002;2001;</xsl:variable>
		<!-- LOGIC FOR RETURNING DATE STRINGS -->
		<xsl:choose>
			<xsl:when test=" $date_part = 'Day' ">
				<xsl:choose>
					<xsl:when test=" $date_sort = 'DayDescending' ">
						<xsl:value-of select="$day_descending"/>
					</xsl:when>
					<xsl:when test=" $date_sort = 'DayAscending' ">
						<xsl:value-of select="$day_ascending"/>
					</xsl:when>
				</xsl:choose>
			</xsl:when>
			<xsl:when test=" $date_part = 'Month' ">
				<xsl:choose>
					<xsl:when test=" $date_sort = 'MonthAscendingShort' ">
						<xsl:choose>
							<xsl:when test=" $match = 'primary' ">
								<xsl:value-of select="$month_ascending_number"/>
							</xsl:when>
							<xsl:when test=" $match = 'secondary' ">
								<xsl:value-of select="$month_ascending_short"/>
							</xsl:when>
							<xsl:when test=" $match = 'text' ">
								<xsl:value-of select="$month_ascending_short"/>
							</xsl:when>
						</xsl:choose>
					</xsl:when>
					<xsl:when test=" $date_sort = 'MonthDescendingShort' ">
						<xsl:choose>
							<xsl:when test=" $match = 'primary' ">
								<xsl:value-of select="$month_descending_number"/>
							</xsl:when>
							<xsl:when test=" $match = 'secondary' ">
								<xsl:value-of select="$month_descending_short"/>
							</xsl:when>
							<xsl:when test=" $match = 'text' ">
								<xsl:value-of select="$month_descending_short"/>
							</xsl:when>
						</xsl:choose>
					</xsl:when>
					<xsl:when test=" $date_sort = 'MonthAscendingLong' ">
						<xsl:choose>
							<xsl:when test=" $match = 'primary' ">
								<xsl:value-of select="$month_ascending_number"/>
							</xsl:when>
							<xsl:when test=" $match = 'secondary' ">
								<xsl:value-of select="$month_ascending_short"/>
							</xsl:when>
							<xsl:when test=" $match = 'text' ">
								<xsl:value-of select="$month_ascending_long"/>
							</xsl:when>
						</xsl:choose>
					</xsl:when>
					<xsl:when test=" $date_sort = 'MonthDescendingLong' ">
						<xsl:choose>
							<xsl:when test=" $match = 'primary' ">
								<xsl:value-of select="$month_descending_number"/>
							</xsl:when>
							<xsl:when test=" $match = 'secondary' ">
								<xsl:value-of select="$month_descending_short"/>
							</xsl:when>
							<xsl:when test=" $match = 'text' ">
								<xsl:value-of select="$month_descending_long"/>
							</xsl:when>
						</xsl:choose>
					</xsl:when>
					<xsl:when test=" $date_sort = 'MonthAscendingNumber' ">
						<xsl:choose>
							<xsl:when test=" $match = 'primary' ">
								<xsl:value-of select="$month_ascending_number"/>
							</xsl:when>
							<xsl:when test=" $match = 'secondary' ">
								<xsl:value-of select="$month_ascending_short"/>
							</xsl:when>
							<xsl:when test=" $match = 'text' ">
								<xsl:value-of select="$month_ascending_number"/>
							</xsl:when>
						</xsl:choose>
					</xsl:when>
					<xsl:when test=" $date_sort = 'MonthDescendingNumber' ">
						<xsl:choose>
							<xsl:when test=" $match = 'primary' ">
								<xsl:value-of select="$month_descending_number"/>
							</xsl:when>
							<xsl:when test=" $match = 'secondary' ">
								<xsl:value-of select="$month_descending_short"/>
							</xsl:when>
							<xsl:when test=" $match = 'text' ">
								<xsl:value-of select="$month_descending_number"/>
							</xsl:when>
						</xsl:choose>
					</xsl:when>
				</xsl:choose>
			</xsl:when>
			<xsl:when test=" $date_part = 'Year' ">
				<xsl:choose>
					<xsl:when test=" $date_sort = 'YearDescending' ">
						<xsl:value-of select="$year_descending"/>
					</xsl:when>
					<xsl:when test=" $date_sort = 'YearAscending' ">
						<xsl:value-of select="$year_ascending"/>
					</xsl:when>
				</xsl:choose>
			</xsl:when>
		</xsl:choose>
	</xsl:template>
	<xsl:template name="DateLabels">
		<xsl:param name="attrId"/>
		<xsl:param name="format"/>
		<xsl:param name="quadrant"/>
		<xsl:if test="string-length($format) &gt; 0">
			<xsl:variable name="char" select="substring($format,1,1)"/>
			<xsl:choose>
				<xsl:when test="$char='Y' or $char='y'"><!--remove 'y' when phase b is stable-->
					<td/>
					<td valign="top">
						<xsl:if test="../Year/@quadrant = $quadrant">
							<font face="{../Year/@face}" size="{../Year/@size}">
								<xsl:value-of select="../Year"/>
							</font>
						</xsl:if>
					</td>
					<td/>
				</xsl:when>
				<xsl:when test="$char='m' or $char='M'">
					<td/>
					<td valign="top">
						<xsl:if test="../Month/@quadrant = $quadrant">
							<font face="{../Month/@face}" size="{../Month/@size}">
								<xsl:value-of select="../Month"/>
							</font>
						</xsl:if>
					</td>
					<td/>
				</xsl:when>
				<xsl:when test="$char='d'">
					<td/>
					<td valign="top">
						<xsl:if test="../Day/@quadrant = $quadrant">
							<font face="{../Day/@face}" size="{../Day/@size}">
								<xsl:value-of select="../Day"/>
							</font>
						</xsl:if>
					</td>
					<td/>
				</xsl:when>
			</xsl:choose>
			<xsl:call-template name="DateLabels">
				<xsl:with-param name="attrId" select="$attrId"/>
				<xsl:with-param name="format">
					<xsl:value-of select="substring($format,2)"/>
				</xsl:with-param>
				<xsl:with-param name="quadrant">
					<xsl:value-of select="$quadrant"/>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:if>
	</xsl:template>
	<xsl:template name="DateDropdowns">
		<xsl:param name="attrId"/>
		<xsl:param name="inputName"/>
		<xsl:param name="format"/>
		<xsl:param name="VCSID"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:if test="string-length($format) &gt; 0">
			<xsl:variable name="char" select="substring($format,1,1)"/>
			<xsl:choose>
				<xsl:when test="$char='Y' or $char='y'"><!--remove 'y' when phase b is stable-->
					<td valign="middle">
						<xsl:if test="../Year/@quadrant = 'left'">
							<font face="{../Year/@face}" size="{../Year/@size}">
								<xsl:value-of select="../Year"/>
							</font>
						</xsl:if>
					</td>
					<td valign="middle">
						<select>
							<xsl:variable name="FieldNameY" select="concat('attr_d',$VCSID,'_',$attrId,'_y')"/>
							<xsl:attribute name="class"><xsl:choose><xsl:when test="$thisPage='PF'"><xsl:value-of select="$inputName"/></xsl:when><xsl:otherwise/></xsl:choose></xsl:attribute>
							<xsl:attribute name="name"><xsl:choose><xsl:when test="$thisPage='SYI'"><xsl:value-of select="$FieldNameY"/></xsl:when><xsl:otherwise><xsl:value-of select="$inputName"/></xsl:otherwise></xsl:choose></xsl:attribute>
							<xsl:if test="$SelectedAttributeXPath[@id=$attrId]/@mvs">
								<xsl:attribute name="name"><xsl:value-of select="$FieldNameY"/>_mvs</xsl:attribute>
								<xsl:attribute name="id"><xsl:value-of select="$FieldNameY"/></xsl:attribute>
								<xsl:attribute name="style">font: italic; color: Gray;</xsl:attribute>
								<xsl:attribute name="onChange">if(this.options[0].value=='mvs'){this.remove(0);this.style.color='black';this.style.fontStyle='normal';this.name=this.name.substring(0,this.name.length-4);};</xsl:attribute>
								<option value="mvs" selected="selected"><xsl:value-of select="/eBay/GlobalSettings/MultipleValuesString"/></option>
							</xsl:if>
							<xsl:choose>
								<xsl:when test="@format">
									<xsl:call-template name="date_options_old"><!--dt:removed this template when phase b is stable-->
										<xsl:with-param name="attr_id" select="$attrId"/>
										<xsl:with-param name="date_part" select=" 'Year' "/>
										<xsl:with-param name="pi_node_set">
											<xsl:for-each select="../Years"><xsl:value-of select="."/><xsl:text>;</xsl:text></xsl:for-each>
										</xsl:with-param>
										<xsl:with-param name="FieldName" select="$FieldNameY"/>
										<xsl:with-param name="VCSID" select="$VCSID"/>
										<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
									</xsl:call-template>	
								</xsl:when>
								<xsl:otherwise>
									<xsl:call-template name="date_options">
										<xsl:with-param name="attr_id" select="$attrId"/>
										<xsl:with-param name="date_part" select=" 'Year' "/>
										<xsl:with-param name="pi_node_set">
											<xsl:for-each select="$CurrentAttributeXPath[@id=$attrId]/ValueList/Value"><xsl:value-of select="Name"/><xsl:text>;</xsl:text></xsl:for-each>
										</xsl:with-param>
										<xsl:with-param name="FieldName" select="$FieldNameY"/>
										<xsl:with-param name="VCSID" select="$VCSID"/>
										<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
									</xsl:call-template>
								</xsl:otherwise>
							</xsl:choose>
						</select>&#160;
					</td>
					<td valign="middle">
						<xsl:if test="../Year/@quadrant = 'right'">
							<font face="{../Year/@face}" size="{../Year/@size}">
								<xsl:value-of select="../Year"/>
							</font>
						</xsl:if>
					</td>
				</xsl:when>
				<xsl:when test="$char='m' or $char='M'">
					<td valign="middle">
						<xsl:if test="../Month/@quadrant = 'left'">
							<font face="{../Month/@face}" size="{../Month/@size}">
								<xsl:value-of select="../Month"/>
							</font>
						</xsl:if>
					</td>
					<td valign="middle">
						<select>
							<xsl:variable name="FieldNameM" select="concat('attr_d',$VCSID,'_',$attrId,'_m')"/>
							<xsl:attribute name="class"><xsl:choose><xsl:when test="$thisPage='PF'"><xsl:value-of select="$inputName"/></xsl:when><xsl:otherwise/></xsl:choose></xsl:attribute>
							<xsl:attribute name="name"><xsl:choose><xsl:when test="$thisPage='SYI'"><xsl:value-of select="$FieldNameM"/></xsl:when><xsl:otherwise><xsl:value-of select="$inputName"/></xsl:otherwise></xsl:choose></xsl:attribute>
							<xsl:if test="$SelectedAttributeXPath[@id=$attrId]/@mvs">
								<xsl:attribute name="name"><xsl:value-of select="$FieldNameM"/>_mvs</xsl:attribute>
								<xsl:attribute name="id"><xsl:value-of select="$FieldNameM"/></xsl:attribute>
								<xsl:attribute name="style">font: italic; color: Gray;</xsl:attribute>
								<xsl:attribute name="onChange">if(this.options[0].value=='mvs'){this.remove(0);this.style.color='black';this.style.fontStyle='normal';this.name=this.name.substring(0,this.name.length-4);};</xsl:attribute>
								<option value="mvs" selected="selected"><xsl:value-of select="/eBay/GlobalSettings/MultipleValuesString"/></option>
							</xsl:if>
							<xsl:choose>
								<xsl:when test="@format"><!--dt:removed this template when phase b is stable-->
									<xsl:call-template name="date_options_old">
										<xsl:with-param name="attr_id" select="$attrId"/>
										<xsl:with-param name="date_part" select=" 'Month' "/>
										<xsl:with-param name="date_sort" select=" name(../*[ (string-length(name()) &gt; 5) and contains(name(), 'Month') and not(contains(name(), 'Initial')) ])"/>
										<xsl:with-param name="FieldName" select="$FieldNameM"/>
										<xsl:with-param name="VCSID" select="$VCSID"/>
										<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
									</xsl:call-template>
								</xsl:when>
								<xsl:otherwise><!--dt:removed this template when phase b is stable-->
									<xsl:call-template name="date_options">
										<xsl:with-param name="attr_id" select="$attrId"/>
										<xsl:with-param name="date_part" select=" 'Month' "/>
										<xsl:with-param name="date_sort" select="../Month/@sort"/>
										<xsl:with-param name="format" select="$format"/>
										<xsl:with-param name="FieldName" select="$FieldNameM"/>
										<xsl:with-param name="VCSID" select="$VCSID"/>
										<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
									</xsl:call-template>
								</xsl:otherwise>
							</xsl:choose>
						</select>&#160;
					</td>
					<td valign="middle">
						<xsl:if test="../Month/@quadrant = 'right'">
							<font face="{../Month/@face}" size="{../Month/@size}">
								<xsl:value-of select="../Month"/>
							</font>
						</xsl:if>
					</td>
				</xsl:when>
				<xsl:when test="$char='d'">
					<td valign="middle">
						<xsl:if test="../Day/@quadrant = 'left'">
							<font face="{../Day/@face}" size="{../Day/@size}">
								<xsl:value-of select="../Day"/>
							</font>
						</xsl:if>
					</td>
					<td valign="middle">
						<select>
							<xsl:variable name="FieldNameD" select="concat('attr_d',$VCSID,'_',$attrId,'_d')"/>
							<xsl:attribute name="class"><xsl:choose><xsl:when test="$thisPage='PF'"><xsl:value-of select="$inputName"/></xsl:when><xsl:otherwise/></xsl:choose></xsl:attribute>
							<xsl:attribute name="name"><xsl:choose><xsl:when test="$thisPage='SYI'"><xsl:value-of select="$FieldNameD"/></xsl:when><xsl:otherwise><xsl:value-of select="$inputName"/></xsl:otherwise></xsl:choose></xsl:attribute>
							<xsl:if test="$SelectedAttributeXPath[@id=$attrId]/@mvs">
								<xsl:attribute name="name"><xsl:value-of select="$FieldNameD"/>_mvs</xsl:attribute>
								<xsl:attribute name="id"><xsl:value-of select="$FieldNameD"/></xsl:attribute>
								<xsl:attribute name="style">font: italic; color: Gray;</xsl:attribute>
								<xsl:attribute name="onChange">if(this.options[0].value=='mvs'){this.remove(0);this.style.color='black';this.style.fontStyle='normal';this.name=this.name.substring(0,this.name.length-4);};</xsl:attribute>
								<option value="mvs" selected="selected"><xsl:value-of select="/eBay/GlobalSettings/MultipleValuesString"/></option>
							</xsl:if>
							<xsl:choose>
								<xsl:when test="@format"><!--dt:removed this template when phase b is stable-->
									<xsl:call-template name="date_options_old">
										<xsl:with-param name="attr_id" select="$attrId"/>
										<xsl:with-param name="date_part" select=" 'Day' "/>
										<xsl:with-param name="date_sort" select=" name(../*[ (string-length(name()) &gt; 3) and contains(name(), 'Day') and not(contains(name(), 'Initial'))])"/>
										<xsl:with-param name="FieldName" select="$FieldNameD"/>
										<xsl:with-param name="VCSID" select="$VCSID"/>
										<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
									</xsl:call-template>
								</xsl:when>
								<xsl:otherwise><!--dt:removed this template when phase b is stable-->
									<xsl:call-template name="date_options">
										<xsl:with-param name="attr_id" select="$attrId"/>
										<xsl:with-param name="date_part" select=" 'Day' "/>						
										<xsl:with-param name="date_sort" select="../Day/@sort"/>
										<xsl:with-param name="FieldName" select="$FieldNameD"/>
										<xsl:with-param name="VCSID" select="$VCSID"/>
										<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
									</xsl:call-template>
								</xsl:otherwise>
							</xsl:choose>
						</select>&#160;
					</td>
					<td valign="middle">
						<xsl:if test="../Day/@quadrant = 'right'">
							<font face="{../Day/@face}" size="{../Day/@size}">
								<xsl:value-of select="../Day"/>
							</font>
						</xsl:if>
					</td>
				</xsl:when>
			</xsl:choose>
			<xsl:call-template name="DateDropdowns">
				<xsl:with-param name="attrId" select="$attrId"/>
				<xsl:with-param name="inputName" select="$inputName"/>
				<xsl:with-param name="format">
					<xsl:value-of select="substring($format,2)"/>
				</xsl:with-param>
				<xsl:with-param name="VCSID" select="$VCSID"/>
				<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
				<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
			</xsl:call-template>
		</xsl:if>
	</xsl:template>
	<xsl:template name="Dropdown">
		<xsl:param name="attrId"/>
		<xsl:param name="inputName"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:param name="VCSID"/>
		<xsl:variable name="parentAttrId" select="$CurrentAttributeXPath[Dependency/@childAttrId=$attrId]/@id"/>
		<xsl:choose>
			<xsl:when test="../../@type='date'">
				<xsl:variable name="format">
					<xsl:choose>
						<xsl:when test="@format">
							<xsl:value-of select="translate(@format,'.-/_, ','')"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="translate($CurrentAttributeXPath[@id=$attrId]/@dateFormat,'.-/_, ','')"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<!-- JO: BUGDB00116454 need to indent if there is text for Day, Month, Year labels -->
				<xsl:variable name="isIndent" select="boolean((../Day and normalize-space(../Day) != '') or (../Month and normalize-space(../Month) != '') or (../Year and normalize-space(../Year) != ''))"/>
				
				<table cellpadding="0" cellspacing="0" border="0" summary="">
					<xsl:if test="../*/@quadrant='top'">
						<tr>
							<xsl:if test="$isIndent = true()"><td>&#160;</td></xsl:if>
							<xsl:call-template name="DateLabels">
								<xsl:with-param name="attrId" select="$attrId"/>
								<xsl:with-param name="format" select="$format"/>
								<xsl:with-param name="quadrant">top</xsl:with-param>
							</xsl:call-template>
						</tr>
					</xsl:if>
					<tr>
						<xsl:if test="$isIndent = true()"><td>&#160;</td></xsl:if>
						<xsl:call-template name="DateDropdowns">
							<xsl:with-param name="attrId" select="$attrId"/>
							<xsl:with-param name="inputName" select="$inputName"/>
							<xsl:with-param name="format" select="$format"/>
							<xsl:with-param name="VCSID" select="$VCSID"/>
							<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
							<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
						</xsl:call-template>
					</tr>
					<xsl:if test="../*/@quadrant='bottom'">
						<tr>
							<xsl:if test="$isIndent = true()"><td>&#160;</td></xsl:if>
							<xsl:call-template name="DateLabels">
								<xsl:with-param name="attrId" select="$attrId"/>
								<xsl:with-param name="format" select="$format"/>
								<xsl:with-param name="quadrant">bottom</xsl:with-param>
							</xsl:call-template>
						</tr>
					</xsl:if>
				</table>
			</xsl:when>
			<xsl:otherwise>
				<xsl:choose>
					<xsl:when test="$thisPage='SYI'">
						<xsl:variable name="FieldName" select="concat('attr',$VCSID,'_',$attrId)"/>
						<xsl:variable name="mvsOnChange"><xsl:if test="$SelectedAttributeXPath[@id=$attrId]/@mvs">if(this.options[0].value=='mvs'){this.remove(0);this.style.color='black';this.style.fontStyle='normal';this.name=this.name.substring(0,this.name.length-4);};</xsl:if></xsl:variable>
						<select>
							<xsl:choose>
								<xsl:when test="$subPage = 'API' and $CurrentAttributeXPath[@id=$attrId]/Dependency[@type = '4' or @type = '5']">
									<xsl:attribute name="onChange"><xsl:value-of select="$mvsOnChange"/><xsl:if test="$CurrentAttributeXPath[@id=$attrId]/Dependency[@type='1']">aus_set_parent('attr<xsl:value-of select="concat($VCSID,'_',$attrId)"/>', this.value); </xsl:if> vvsp_check('attr<xsl:value-of select="concat($VCSID,'_',$attrId)"/>', this.value);</xsl:attribute>
								</xsl:when>
								<xsl:when test="$CurrentAttributeXPath[@id=$attrId]/Dependency[@type='1']">
									<xsl:attribute name="onChange"><xsl:value-of select="$mvsOnChange"/>aus_set_parent('attr<xsl:value-of select="concat($VCSID,'_',$attrId)"/>',1);<xsl:if test="$subPage = 'API' ">api_check_on_other('attr<xsl:value-of select="concat($VCSID,'_',$attrId)"/>',this.value);</xsl:if></xsl:attribute>
								</xsl:when>
								<xsl:when test="$CurrentAttributeXPath[@id=$attrId]/Dependency[@type='2']">
									<xsl:attribute name="onChange"><xsl:value-of select="$mvsOnChange"/>vvpPost('attr<xsl:value-of select="concat($VCSID,'_',$attrId)"/>',this.value);<xsl:if test="$subPage = 'API' ">api_check_on_other('attr<xsl:value-of select="concat($VCSID,'_',$attrId)"/>',this.value);</xsl:if></xsl:attribute>
								</xsl:when>
								<xsl:when test="$subPage = 'API' ">
									<xsl:attribute name="onChange"><xsl:value-of select="$mvsOnChange"/>api_check_on_other('attr<xsl:value-of select="concat($VCSID,'_',$attrId)"/>',this.value);</xsl:attribute>
								</xsl:when>
								<xsl:otherwise>
									<xsl:attribute name="onChange"><xsl:value-of select="$mvsOnChange"/></xsl:attribute>
								</xsl:otherwise>
							</xsl:choose>
							<xsl:choose>
								<xsl:when test="$SelectedAttributeXPath[@id=$attrId]/@mvs">
									<xsl:attribute name="name"><xsl:value-of select="$FieldName"/>_mvs</xsl:attribute>
									<xsl:attribute name="id"><xsl:value-of select="$FieldName"/></xsl:attribute>
									<xsl:attribute name="style">font: italic; color: Gray;</xsl:attribute>
									<option value="mvs" selected="selected"><xsl:value-of select="/eBay/GlobalSettings/MultipleValuesString"/></option>
								</xsl:when>
								<xsl:otherwise>
									<xsl:attribute name="name"><xsl:value-of select="$FieldName"/></xsl:attribute>
								</xsl:otherwise>
							</xsl:choose>
							<xsl:choose>
								<xsl:when test="$parentAttrId">
									<xsl:choose>
										<xsl:when test="$CurrentAttributeXPath[@id=$parentAttrId]/*[@isVisible='true']">
											<xsl:apply-templates select="$CurrentAttributeXPath[@id=$parentAttrId]/Dependency[(@type='1' or @type='2') and @childAttrId=$attrId and @isVisible='true']" mode="isVisible">
												<xsl:with-param name="attrId" select="$attrId"/>
											</xsl:apply-templates>
											<xsl:apply-templates select="$CurrentAttributeXPath[@id=$parentAttrId]/Dependency[(@type='1' or @type='2') and @childAttrId=$attrId and @isVisible='true']" mode="isVisible">
												<xsl:with-param name="attrId" select="$attrId"/>
												<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
												<xsl:with-param name="FieldName" select="$FieldName"/>
											</xsl:apply-templates>
										</xsl:when>
										<xsl:otherwise>
											<xsl:variable name="ParentFieldName">
												<xsl:if test="$UsePostedFormFields">
													<xsl:value-of select="concat('attr',$VCSID,'_',$parentAttrId)"/>
												</xsl:if>
											</xsl:variable>
											<xsl:variable name="SelectedParentValueId" select="$FormFields/FormField[$ParentFieldName!='' and @name = $ParentFieldName]/Value | $SelectedAttributeXPath[@id=$parentAttrId]/Value/@id"/>
											<xsl:variable name="syiParentValueId" select="$SelectedParentValueId | $CurrentAttributeXPath[not($SelectedParentValueId) and @id=$parentAttrId]/ValueList/Value[1]/@id"/>
											<xsl:choose>
												<xsl:when test="$subPage='API' and $CurrentAttributeXPath[@id=$parentAttrId]/Dependency[(@type='3' or @type='4' or @type='5') and @parentValueId=$syiParentValueId and @childAttrId=$attrId]">
													<xsl:variable name="values" select="$CurrentAttributeXPath[@id=$attrId]/ValueList/Value | $CurrentAttributeXPath[@id=$parentAttrId]/Dependency[@parentValueId=$syiParentValueId and @childAttrId=$attrId]/Value[count(. | key('attrByIDs', concat($VCSID, '_', key('selectedAttrByIDs', concat($VCSID, '_', $parentAttrId, '_', $syiParentValueId))/@id, '_', @id))[1])=1]"/>
													<xsl:apply-templates select="$values">
														<xsl:sort select="@id"/>
														<xsl:with-param name="attrId" select="$attrId"/>
														<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
														<xsl:with-param name="FieldName" select="$FieldName"/>
													</xsl:apply-templates>
												</xsl:when>
												<xsl:when test="($SelectedParentValueId = '-10') or (not($SelectedParentValueId) and ($CurrentAttributeXPath[@id=$parentAttrId]/ValueList/Value[1]/@id = '-10' or not($CurrentAttributeXPath[@id=$parentAttrId]/ValueList)))">
													<xsl:call-template name="EmptyDropdown"/>						
												</xsl:when>												
												<xsl:when test="$syiParentValueId and $CurrentAttributeXPath[@id=$parentAttrId]/Dependency[@type='1' or @type='2']">
													<xsl:variable name="values" select="$CurrentAttributeXPath[@id=$parentAttrId]/Dependency[ (@parentValueId=$syiParentValueId) and (@childAttrId = $attrId) ]"/>
													<xsl:choose>
													<xsl:when test="not($values)">
													<xsl:call-template name="EmptyDropdown"/>	
													</xsl:when>
													<xsl:otherwise>
													<xsl:apply-templates select="$values" mode="dep">
														<xsl:with-param name="attrId" select="$attrId"/>
														<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
														<xsl:with-param name="FieldName" select="$FieldName"/>
													</xsl:apply-templates>
													</xsl:otherwise>
													</xsl:choose>
												</xsl:when>
											</xsl:choose>
										</xsl:otherwise>
									</xsl:choose>
								</xsl:when>
								<xsl:otherwise>
									<xsl:apply-templates select="$CurrentAttributeXPath[@id=$attrId]/ValueList/Value">
										<xsl:with-param name="attrId" select="$attrId"/>
										<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
										<xsl:with-param name="FieldName" select="$FieldName"/>
									</xsl:apply-templates>
								</xsl:otherwise>
							</xsl:choose>
						</select>
					</xsl:when>
					<xsl:otherwise>
						<xsl:variable name="pfId" select="$CurrentAttributeXPath[@id=$attrId]/InputFields/Input/Value/@pfId"/>
						<xsl:variable name="pfPageType" select="$CurrentAttributeXPath[@id=$attrId]/InputFields/Input/Value/@pfPageType"/>
						<xsl:variable name="selectedValue" select="$CurrentAttributeXPath[@id=$attrId]/InputFields/Input/Value/@id"/>
						<select>
							<xsl:if test="$attrData[@id=$attrId]/Dependency/@type='1'">
								<xsl:attribute name="onChange">aus_set_parent('<xsl:value-of select="$inputName"/>',1);</xsl:attribute>
							</xsl:if>
							<xsl:attribute name="name"><xsl:value-of select="$inputName"/></xsl:attribute>
							<xsl:attribute name="class"><xsl:value-of select="$inputName"/></xsl:attribute>
							<xsl:choose>
								<xsl:when test="$parentAttrId">
									<xsl:variable name="parentValueId" select="$returnAttr[@id=$parentAttrId]/InputFields/Input/Value/@id"/>
									<xsl:choose>
										<xsl:when test="$parentValueId != '-24'">
											<xsl:choose>
												<xsl:when test="$attrData[@id=$parentAttrId]/Dependency[@parentValueId=$parentValueId and @childAttrId=$attrId]">
													<xsl:apply-templates select="$attrData[@id=$parentAttrId]/Dependency[@parentValueId=$parentValueId and @childAttrId=$attrId]/Value" mode="dep"/>
												</xsl:when>
												<xsl:otherwise>
													<script LANGUAGE="JavaScript1.1">
														var thisChild = "a<xsl:value-of select="$attrId"/>"; //if child does not have dep valuelist, then disable it.
														aus_disable_child(thisChild);
													</script>
													<xsl:call-template name="EmptyDropdown"/>
												</xsl:otherwise>
											</xsl:choose>
										</xsl:when>
										<xsl:otherwise>
											<xsl:call-template name="EmptyDropdown"/>
										</xsl:otherwise>
									</xsl:choose>
								</xsl:when>
								<xsl:otherwise>
									<xsl:apply-templates select="$attrData[@id=$attrId]/ValueList/Value">
										<xsl:with-param name="selectedValue" select="$selectedValue"/>
										<xsl:with-param name="pfId" select="$pfId"/>
										<xsl:with-param name="pfPageType" select="$pfPageType"/>
									</xsl:apply-templates>
									<xsl:if test="$pfId and $pfPageType">
										<option value="{$selectedValue}" selected="selected">
											<xsl:choose>
												<xsl:when test="$attrData[@id=$attrId]/InputFields/Input/Value[DisplayName!='']">
													<xsl:value-of select="$attrData[@id=$attrId]/InputFields/Input/Value/DisplayName"/>
												</xsl:when>
												<xsl:otherwise>
													<xsl:value-of select="$attrData[@id=$attrId]/InputFields/Input/Value/Name"/>
												</xsl:otherwise>
											</xsl:choose>
										</option>
									</xsl:if>
								</xsl:otherwise>
							</xsl:choose>
						</select>
						<xsl:if test="$pfId and $pfPageType">
							<input type="hidden">
								<xsl:attribute name="name">sovcf_<xsl:value-of select="$attrId"/>_<xsl:value-of select="$selectedValue"/></xsl:attribute>
								<xsl:attribute name="value"><xsl:value-of select="$pfId"/>_<xsl:value-of select="$pfPageType"/></xsl:attribute>
							</input>
						</xsl:if>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template match="Input" mode="attributes">
		<xsl:param name="attrId"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:param name="inputName" select="$returnAttr[@id=$attrId]/InputFields/Input/@name"/>
		<xsl:variable name="VCSID" select="../../../../../../@id"/>
		<xsl:choose>
			<xsl:when test="$RootNode/Recommendations/Attributes/AttributeSet/Attribute[@id=$attrId]">
				<xsl:call-template name="Recommendations"><xsl:with-param name="attrId" select="$attrId"/><xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/><xsl:with-param name="VCSID" select="$VCSID"/></xsl:call-template>
			</xsl:when>
			<xsl:when test="$CurrentAttributeXPath[@id = $attrId][EditType = 1 or EditType = 2] and $SelectedAttributeXPath[@id = $attrId][@source = 1 or @source=3]">
				<font size="2">
				<b>
					<xsl:choose>
						<xsl:when test="$subPage = 'API' and $SelectedAttributeXPath[@id = $attrId]/Value[Month or Day or Year]">
							<xsl:apply-templates mode="API" select="$SelectedAttributeXPath[@id = $attrId]/Value">
								<xsl:with-param name="attrId" select="$attrId"/>
								<xsl:with-param name="PI.Attribute" select="../../node()"/>
								<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
							</xsl:apply-templates>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$SelectedAttributeXPath[@id = $attrId]/Value/Name"/>
						</xsl:otherwise>
					</xsl:choose>
				</b>
				</font>
			</xsl:when>
			<xsl:when test="@type = 'dropdown'">
				<xsl:call-template name="Dropdown">
					<xsl:with-param name="attrId" select="$attrId"/>
					<xsl:with-param name="inputName" select="$inputName"/>
					<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
					<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
					<xsl:with-param name="VCSID" select="$VCSID"/>
				</xsl:call-template>
				<xsl:if test="$thisPage='SYI' and $subPage != 'API'">
					<!-- this is to make sure we pass in some value for disabled dropdowns (for VI to read) -->
					<input type="hidden" name="{concat('attr_m',$VCSID,'_',$attrId)}"  value="-10"/>
				</xsl:if>
			</xsl:when>
			<xsl:when test="@type = 'textfield'">
				<xsl:call-template name="TextField">
					<xsl:with-param name="attrId" select="$attrId"/>
					<xsl:with-param name="inputName" select="$inputName"/>
					<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
					<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
					<xsl:with-param name="VCSID" select="$VCSID"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:when test="@type = 'hidden' ">
				<xsl:variable name="syiParentAttrId" select="$CurrentAttributeXPath[Dependency/@childAttrId=$attrId]/@id"/>
				<xsl:variable name="syiParentValueId" select="$SelectedAttributeXPath[@id=$syiParentAttrId]/Value/@id[. = $CurrentAttributeXPath/Dependency[@childAttrId=$attrId]/@parentValueId]"/>
				<xsl:variable name="dependentAttrValues" select="$CurrentAttributeXPath[@id=$syiParentAttrId]/Dependency[@parentValueId=$syiParentValueId and @childAttrId=$attrId]/Value[count(. | key('attrByIDs', concat($VCSID, '_', key('selectedAttrByIDs', concat($VCSID, '_', ../../../@id, '_', ../@parentValueId))/@id, '_', @id))[1])=1]"/>
				<xsl:variable name="attrValues" select="$CurrentAttributeXPath[@id=$attrId]/ValueList/Value"/>
				<xsl:variable name="attrs" select="$attrValues[not($dependentAttrValues[@id != 0])] | $dependentAttrValues[@id != 0]"/>
				<input type="hidden" name="{concat('attr_hidden',$VCSID,'_',$attrId)}" value="{$attrs/@id}"/>
			</xsl:when>
			<xsl:when test="@type = 'checkbox' or @type = 'radio'">
				<xsl:if test="$thisPage='SYI' and $subPage != 'API'">
					<input type="hidden" name="{concat('attr_m',$VCSID,'_',$attrId)}"  value="-10"/>
				</xsl:if>
				<xsl:call-template name="CheckboxRadio">
					<xsl:with-param name="attrId" select="$attrId"/>
					<xsl:with-param name="columns" select="@columns"/>
					<xsl:with-param name="type" select="@type"/>
					<xsl:with-param name="inputName" select="$inputName"/>
					<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
					<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
					<xsl:with-param name="VCSID" select="$VCSID"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:when test="@type = 'textarea'">
				<xsl:variable name="FieldName">
					<xsl:choose>
						<xsl:when test="$thisPage='SYI'"><xsl:value-of select="concat('attr_t',$VCSID,'_',$attrId)"/></xsl:when>
						<xsl:otherwise><xsl:value-of select="$inputName"/></xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<xsl:variable name="InputValue">
					<xsl:choose>
						<xsl:when test="$UsePostedFormFields">
							<xsl:value-of select="$FormFields/FormField[@name = $FieldName]/Value"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$SelectedAttributeXPath[@id=$attrId]/Value/Name"/>
 						</xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<textarea rows="{@rows}" cols="{@cols}" name="{$FieldName}">
					<xsl:value-of select="$InputValue"/>
				</textarea>
			</xsl:when>
			<xsl:when test="@type='collapsible_textarea'">
				<xsl:variable name="DivId" select="concat($VCSID,'_',$attrId)"/>
				<xsl:variable name="FieldName">
					<xsl:choose>
						<xsl:when test="$thisPage='SYI'">
							<xsl:value-of select="concat('attr_t',$VCSID,'_',$attrId)"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$inputName"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<xsl:variable name="TrueInputValue">
					<xsl:choose>
						<xsl:when test="$UsePostedFormFields">
							<xsl:value-of select="$FormFields/FormField[@name = $FieldName]/Value"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$SelectedAttributeXPath[@id=$attrId]/Value/Name"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<xsl:variable name="attrMessageBottom" select="normalize-space($CurrentAttributeXPath[@id = $attrId]/MessageBottom)"/>
				<textarea name="{$FieldName}">
					<xsl:copy-of select="@*[name() != 'type']"/>
					<xsl:value-of select="$TrueInputValue"/>
				</textarea>
			</xsl:when>
			<xsl:when test="@type = 'single' or @type = 'multiple'">
				<xsl:if test="$thisPage='SYI' and $subPage != 'API'">
					<input type="hidden" name="{concat('attr_m',$VCSID,'_',$attrId)}"  value="-10"/>
				</xsl:if>
				<xsl:call-template name="SingleMultiple">
					<xsl:with-param name="attrId" select="$attrId"/>
					<xsl:with-param name="inputName" select="$inputName"/>
					<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
					<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
					<xsl:with-param name="VCSID" select="$VCSID"/>
				</xsl:call-template>
			</xsl:when>
		</xsl:choose>
	</xsl:template>
	<xsl:template name="JS">
			<script LANGUAGE="JavaScript1.1">
				<xsl:comment>
	
			<![CDATA[
aus_useragent = navigator.userAgent.toLowerCase();
aus_is_opera = (aus_useragent.indexOf("opera") != -1);
aus_is_net60 = (aus_useragent.indexOf("netscape6/6.0") != -1);
aus_no_editing_allowed = 0;
aus_no_adding_allowed = 0;
aus_non_editable_props = { }


function getPageDoc() {
	if (typeof formName == "undefined") {
	formName = "ListItemForSale";
	}

	return document.forms[formName];
}

function vvpPost(parentAttrId,newSelectedParentValueId,is_page_loaded)
{
	var child_name=aus_parent_child[parentAttrId];
	var oldSelectedParentValueId=vvpSelectedValue[parentAttrId];
	theseParentValues=vvpArray[parentAttrId];
	var len=theseParentValues.length;
	var isOldSelectedParentValueInArray=false;
	var isNewSelectedParentValueInArray=false;
	for(var i=0;i<len;i++)
	{
		if(newSelectedParentValueId==theseParentValues[i])
		{
			isNewSelectedParentValueInArray=true;
		}
		if(oldSelectedParentValueId==theseParentValues[i])
		{
			isOldSelectedParentValueInArray=true;
		}
	}
	if(oldSelectedParentValueId!=""&&oldSelectedParentValueId!="-10")
	{
		if(newSelectedParentValueId==oldSelectedParentValueId||(isNewSelectedParentValueInArray==false&&isOldSelectedParentValueInArray==false))
		{
			if(isNewSelectedParentValueInArray==false&&isOldSelectedParentValueInArray==false)
				vvs_disable_children(parentAttrId);
			return;
		}
		else if(isNewSelectedParentValueInArray==true||(isNewSelectedParentValueInArray==false&&isOldSelectedParentValueInArray==true))
		{
			if(!is_page_loaded) {
				reset_children(child_name);
				aus_js_submit();
			}
		}
		else 
			return;
	}
	else{
		if(isNewSelectedParentValueInArray==true)
		{
			if(!is_page_loaded) {
				reset_children(child_name);
				aus_js_submit();
			}
		}
		else
		{
			if(!is_page_loaded) {
				vvs_disable_children(parentAttrId);
			}
			return;
		}
	}
}

function vvsp_post(attributeId, attributeValue) {
	var getvvspChoices = vvsp_choices[attributeId];
	var getLength = getvvspChoices.length;
	var post = 0;
	for (var i=0; i<getLength; i++) if (attributeValue == getvvspChoices[i])  post = 1;

	if (post){
		pagedoc = getPageDoc();
		pagedoc.aus_form_changed.value = 1;
		pagedoc.ButtonLoad.value = 1;
		disable_inputs();
		pagedoc.submit();
	} else {
]]>
<xsl:if test="$subPage='API' ">
		api_check_on_other(attributeId, attributeValue);
</xsl:if>
<![CDATA[
		return;
	}
}

function vvsp_check(attributeId, attributeValue) {
	// vvsp_choices may have duplicate objects
	//var vvspChoices = vvsp_choices[attributeId];
	var vvspChoices = vvsp_choices2[attributeId];
	if (attributeId != 1) {
		//for (var i=0; i< vvspChoices.length; i++) if (attributeValue == vvspChoices[i]) aus_js_submit();
		if (vvspChoices) aus_js_submit();
	} else {
		var send = 1;
		for (var i=0; i< vvspChoices.length; i++) if (attributeValue == vvspChoices[i]) send = 0;
		if (send) aus_js_submit();
	}
]]>
<xsl:if test="$subPage='API' ">
		api_check_on_other(attributeId, attributeValue);
</xsl:if>
<![CDATA[
	return;
}

// DM - ONLY WORKS IF PARENT IS A SELECT OBJECT
function vvc_anyParent(parent_name, parent_value) {
	var aus_form = getPageDoc();
    	var parentObject =  aus_get_form_object_from_name(parent_name);
   	var child_name = aus_parent_child[parent_name];
   	if (child_name.length) {
   		for (i =0; i < child_name.length; i++)
	   		vvc_updateChild(parent_name, parent_value,child_name[i]);
   	}
   	else {
	   		vvc_updateChild(parent_name, parent_value,child_name);
   	}
 	return;
}

function vvc_updateChild(parent_name, parent_value,child_name) {
    	var parentObject =  aus_get_form_object_from_name(parent_name);
   	var childObject = aus_get_form_object_from_name(child_name);
    	if (!childObject) return;
    	
    	// DM - IF THE PARENT VALUE IS any OR other, DISABLE THE CHILD
    	// DM - IN OTHER WORDS, IF IT CONTAINS A NEGATIVE VALUE
 	if (parent_value.indexOf("-") > -1 || (parentObject.type=="checkbox" && !parentObject.checked)) {
		if (childObject.options) childObject.options.length = 0;
		childObject.className = "fielddisabled";
		childObject.disabled = true;
  		return;
	} else {
    		childObject.className = "fieldenabled";
    		childObject.disabled = false;
    		if (childObject.options) {
    			// DM - THE CHILD IS A SELECT OBJECT
	  		var child_options = childObject.options;
	 		child_options.length = 0;
	   	 	var child_option_data = aus_dependent_choices[child_name];
	   	 	if (!child_option_data) return;
	     		// DM - ADD THE OPTIONS (LEAVING THIS OLD CODE ALONE FOR NOW)
			var ptr = child_option_data[parent_value];
	    		var j = 0;
	    		for (var i in ptr) {
	  			var option_name = ptr[i][0];
	  			var option_id = ptr[i][1];
	  			childObject.options[j] = new Option(option_name, option_id);
	  			if (ptr[i][2] == 'default') 
	  				childObject.options[j].selected = true;
	  			if (parentObject.checked) {
	   				childObject.className = "fieldenabled";
	   				childObject.disabled = false;
	  			}
	  			j++;
	 		}
	 	} 
 	}
 	return;
}

function disable_inputs(){
        var aus_form = getPageDoc();  
	for (var i=0; i<aus_form.length; i++){
		aus_form.elements[i].className = "fielddisabled";
	}
}

function aus_js_submit() {
	var aus_form = getPageDoc();	
    	if (! aus_is_opera) {
        	// DM - aus_form_changed IS NOT UPDATED ON MAC IE 5.1, SO I'M TRYING SOMETHING STRANGE
        	// aus_form.aus_form_changed.value = 1;
        	for (var i =0;i< aus_form.length;i++) if (aus_form.elements[i].name=="aus_form_changed") aus_form.elements[i].value=1;
        	aus_form.ButtonLoad.value = 1;
		disable_inputs();
        	aus_form.submit();
    	}
}

function aus_set_parent(parent_name, is_sell,is_load_time) {
	/*var parentValue = aus_get_object_value(parent_name);
	if ((parentValue == "-12")) {
		return;
	}*/
	
    if (aus_non_editable_props[parent_name]) {
        return;
    }
    
    var child_name = aus_parent_child[parent_name];
    if (child_name == null) {
        return;
    }

	var parent_values = get_object_values(parent_name);    
    var data = aus_dependent_choices[child_name];
    if (data == null) {
		
		if ((parent_values == null) || (parent_values[0] == "-11") || (parent_values[0] == "-12") || (parent_values[0] == "-24")  || (parent_values[0] == "-10")  || (parent_values[0] == "-6")) {
			aus_disable_children(parent_name);
			return;
		}
		if (is_load_time)
			return;

        reset_children( child_name );
        aus_js_submit();
        return;
    }
    else if (is_load_time)
		return;
    
    aus_load_child(parent_name, child_name, is_sell);
    aus_set_parent(child_name, is_sell);
    
}

function reset_children( parent_name ) {
	// make sure we post empty values for all dependents  when doing vvp
    	var form_object =  aus_get_form_object_from_name(parent_name);
   	if (!form_object) return null;
   	form_object.value = "";
	var child_name = aus_parent_child[parent_name];
	if(child_name != null) {
		reset_children( child_name );
	}
}

function hasValue(select, value) {
	// DM - ONLY FOR SELECT OBJECTS
	if (!select.options) return false;
	for (var i=0; i< select.options.length; i++) {
		if (select.options[i].value == value) return true;
	}
	return false;
}

function aus_load_child(parent_name, child_name, is_sell) { 
	// @@@@ add flag to submit or not
    	if (aus_non_editable_props[parent_name]) return;
  	if (aus_non_editable_props[child_name]) return;
                                                                
    	// first, check to see if parent_value is '' (meaning - or Any)
    	// $$jb: changing this to use my new function that returns an array of values
    	// $$jb: looks to me like 'Any' has a value of -24 and 'Other' has -12 or -11. 
    	var parent_values = get_object_values(parent_name);
    	//var parent_value = aus_get_object_value(parent_name);
    	//if  ((parent_values == null) || (parent_values[0] == "-11") || (parent_values[0] == "-12") || (parent_values[0] == "-24")) {
    	if  ((parent_values == null) || (parent_values[0] == "-11") || (parent_values[0] == "-12") || (parent_values[0] == "-24")  || (parent_values[0] == "-10")) {
    	//if  ((parent_value == null) || (parent_value == "") || (parent_value == "OTHER")) {
        	aus_disable_children(parent_name);
        	return;
    	}
    		
    	// get the child and reset options
    	var child_select = aus_get_form_object_from_name(child_name);    	
    	if (! child_select) return;
    	if (! child_select.options ) return;

    	var dependent_parent_values = aus_dependent_choices[child_name];
    	if (!dependent_parent_values) return;     
    	
    	child_select.disabled = false;
	child_select.className = "fieldenabled";    	
    	child_select.options.length = 0; // clear previous options
    	
    	for (var i=0; i< parent_values.length; i++) {
	    	// add options for the selected parent values that have dependencies
    		if ( dependent_parent_values[ "attr"+parent_values[i] ] ) {
    			var j = 0;
		    	var child_options = dependent_parent_values[ "attr"+parent_values[i] ];
		    	for (var k=0; k< child_options.length; k++) {
		    		var option_id = child_options[k][1];
		    		var option_name = child_options[k][0];
		    		// VVMC - don't add the same option twice and don't add "other" yet
		    		// if (option_id != "-12" && option_id != "-11" && !hasValue(child_select, option_id)) {
			            		child_select.options[j] = new Option(option_name, option_id);
			       	 j++;
		       	 //}
		    	}
		    	// if SYI, the last option might be "other"
    			if (is_sell) {
    		  		var allow_other = aus_allow_other[child_name];
                		if (allow_other) child_select.options[j] = new Option("Other", -11);
			}
		    	child_select.options[0].selected=true;
    		}
    	} 
    	
    	if (child_select.options.length == 0) {
    		// if there are no options in the child, disable it
    		aus_disable_child(child_name);    
    	} else {
    		child_select.options[0].selected=true;
    	}

  	return;
}
        
function aus_get_form_object_from_name(object_name) {
    var aus_form = getPageDoc();
    var object = aus_form[object_name];
    return object;
}

function aus_get_object_value(select_name) {
    var form_object = aus_get_form_object_from_name(select_name);
    if (! form_object) {
        return null;
    }
    var select_options = form_object.options;
    if (! select_options) {
        if (form_object.value != null) { // may be a hidden field
            return form_object.value
        } else {
            return null;
        }
    }
    var selected_index = form_object.selectedIndex;
    if (selected_index == null) {
        return null;
    }
        
    var selected_option = form_object.options[selected_index];
    if (! selected_option) {
        return null;
    }
    
    var select_value = selected_option.value;
    return select_value;
}

// DM - UPDATED FOR VVMC, RADIO BUTTONS AND CHECKBOXES
// DM - RETURNS AN ARRAY OF THE SELECTED VALUES FOR A NAMED FORM OBJECT
function get_object_values(select_name) {
	var selected_values;
    	var form_object = aus_get_form_object_from_name(select_name);
   	if (!form_object) return null;
   
    	// check for hidden fields and unknown conditions
    	// AND SINGLE CHECKBOX
    	if (!form_object.options && !form_object.length) {
    	 	if (form_object.value != null) { 
    	 	      if (form_object.type=="checkbox") {
    	 	          if (form_object.checked) {
    	 	              return new Array( form_object.value );
    	 	          } else {
    	 	              return null;
    	 	          }
    	 	      } else {
    			    // may be a hidden field
            		    return new Array( form_object.value );
            		}
       	} else {
       		return null;
       	}
       }

    	// get number of selected values
    	var num_selected_values = 0;
    	var len = (form_object.options) ? form_object.options.length : form_object.length;
    	for( var i=0; i < len; i++ ) {
    		if ( form_object.options ) {
       		if( form_object.options[i].selected ) num_selected_values++;
       	} else {
       		if( form_object[i].checked ) num_selected_values++;
       	}
    	}
    	
    	// load the array of selected values or return null
	if ( num_selected_values == 0 ) {
	        return null;
	} else {
	       selected_values = new Array( num_selected_values );
		var tmpindex = 0;
		for( var i=0; i < len; i++ ) {
			if ( form_object.options ) {
	           		if ( form_object.options[i].selected ) selected_values[tmpindex++] = form_object.options[i].value;
	            	} else {
	            		if ( form_object[i].checked ) selected_values[tmpindex++] = form_object[i].value;
	            	}
	        }
	}

	return selected_values;
}

function vvs_disable_children(parent_name) {
    	var child_name = aus_parent_child[parent_name];
    	var infinite_break = 100;
    	var i = 0;
    	if (child_name) {

			if (child_name.length) {
				for(j =  0; j < child_name.length; j++) {
					var next_child = child_name[j];
					aus_disable_child(next_child); // disable the immediate child...
					aus_disable_children(next_child);
				}
			}
			else {
				aus_disable_child(child_name); // disable the immediate child...
				aus_disable_children(next_child);
			}

    	}
    
    	return;
}


function aus_disable_children(parent_name) {
	// DM - UPDATED FOR VVMC, RADIO BUTTONS AND CHECKBOXES
    	var child_name = aus_parent_child[parent_name];
    	var infinite_break = 100;
    	var i = 0;
    	if (child_name) {
        	// if the parent has something selected (other than -, Any, or OTHER), we stop
        	//var parent_value = aus_get_object_value(parent_name);
        	var parent_values = get_object_values(parent_name);
        	if (parent_values) {
        		for (var j=0; j<parent_values.length; j++) {
       			//if ((parent_value != null) && (parent_value != "") && (parent_value != "OTHER")) return
       			if ((parent_values[j] != null) && (parent_values[j] != "") && (parent_values[j].indexOf("-")<0 )) return;
        		}
        	}

			if (child_name.length) {
				for(j =  0; j < child_name.length; j++) {
					var next_child = child_name[j];
					aus_disable_child(next_child); // disable the immediate child...
					aus_disable_children(next_child);
				}
			}
			else {
				aus_disable_child(child_name); // disable the immediate child...
				aus_disable_children(next_child);
			}

//        	aus_disable_child(child_name); // disable the immediate child...
//        	parent_name = child_name;      // ..and repeat disabling from here
//        	child_name = aus_parent_child[parent_name];
//        	i++;
//        	if (i > infinite_break) break;
    	}
    
    	return;
}

function aus_disable_children_conditionally(parent_name) {
    var child_name = aus_parent_child[parent_name];
    var infinite_break = 100;
    var i = 0;
    var disabled_children = 0;
    while (child_name) {
        if (disabled_children || aus_disabled_if_empty[child_name] || !aus_allow_other[child_name]) {
            aus_disable_child(child_name);
            disabled_children = 1;
        }
            
        parent_name = child_name;      // ..and repeat disabling from here
        child_name = aus_parent_child[parent_name];
        i++;
        if (i > infinite_break) {
            break;
        }
    }
    
    return disabled_children;
}

function aus_disable_child(child_name) {
    if (aus_non_editable_props[child_name]) {
        return;
    }
    
    var child_select = aus_get_form_object_from_name(child_name);
    if (! child_select) return;
   	if (! child_select.options ) return;    

    var disabled_label = aus_disabled_labels[child_name];
    
    child_select.options.length = 1;
    child_select.options[0] = new Option(disabled_label, "");
    child_select.options[0].selected=true;
    
    if (!aus_is_net60) {
        child_select.disabled = true;
        child_select.className = "fielddisabled";
    }
    return;
}

function aus_get_influencer_value_string(child_name) {
    	// DM - UPDATED FOR VVMC, RADIO BUTTONS AND CHECKBOXES
    	// THIS RETURNS THE SELECTED VALUES FOR A PARENT AS A STRING
    	// WE SHOULD NOT NEED THIS FUNCTION ANY MORE
    	var inf_array = aus_influencers[child_name];
   	if (! inf_array)  return null;
    	var influencer_values;
    	if (inf_array.length) {
        	for (var i=0; i<inf_array.length; i++) {
            		//var influencer_value = aus_get_object_value(inf_array[i]);
            		var values = get_object_values(inf_array[i]);
            		//influencer_values = aus_add_influencer_value(influencer_values, influencer_value);
            		if (values) for (var i=0; i<values.length; i++ ) influencer_values = aus_add_influencer_value(influencer_values, values[i]);
        	}
    	} else {
        	return null;
    	}
    	return influencer_values;
}

function aus_add_influencer_value(value_string, influencer_value) {
    if (influencer_value) {
        if (value_string) {
            value_string = value_string + "," + influencer_value;
        } else {
            value_string = influencer_value;
        }
    }
    return value_string;
}
function aus_init_cascades(parent_name, is_sell) {
	// DM - UPDATED FOR VVMC, RADIO BUTTONS AND CHECKBOXES
    	if (aus_is_opera) {
        	// opera executes javascript before rendering html forms, so return if opera
        	return;
    	}
    	//var parent_select = aus_get_form_object_from_name(parent_name);
    	//if (parent_select == null) return;
    	
    	//var parent_value = aus_get_object_value(parent_name);
    	var values = get_object_values(parent_name);
    	
    	if (!values) {
    		aus_disable_children(parent_name);
    		return;
    	}
    	if(values.length > 0 && values[0] == '-6')
    	{
    		others_selected[parent_name] = values[0];
    	}
    	for (var i=0; i< values.length; i++) {
    		//if  ((parent_value == null) || (parent_value == "") || (parent_value == "-6")) {
    		if  ((values[i] == null) || (values[i] == "") || (values[i].indexOf("-")>-1)) {
        		aus_disable_children(parent_name);
    		} else {
        		var child_name = aus_parent_child[parent_name];
        		if (child_name) {
					for(var j=0;j<child_name.length;j++)
					{
            			var child_select = aus_get_form_object_from_name(child_name[j]);
						if (! child_select) return;						
						if (! child_select.options ) return;

            			if (! aus_non_editable_props[child_name[j]]) {
                			var child_selected_index = child_select.selectedIndex;
                			aus_load_child(parent_name, child_name[j], is_sell);
                			//aus_set_selected_by_index(child_select, child_selected_index);
            			}
            			// recurse 
            			aus_init_cascades(child_name[j], is_sell);     
            		}
        		}
        	}
    	}
}
 
function aus_set_selected_by_index(select_obj, selected_index) {
    if ((select_obj) && (selected_index < select_obj.options.length)) {
        select_obj.options[selected_index].selected=true;
    }
}

function createButtonLoad() {
	document.write("<input type='hidden' name='ActionAttributeLoad'>");
}

function autoSelect()
{
	if(document.all)
	{
		fr = getPageDoc();
	 	fr.elements['autoselect'].checked=true;
	}
	else if(navigator.appName=="Netscape")
	{
		fr = getPageDoc();
		fr.elements['ebay12'][1].checked=true;
	}
	return false;
}

]]>
<xsl:if test="$subPage = 'API' ">
<![CDATA[
function api_check_on_other(attributeId, attributeValue) {
	if(attributeValue== -6 || others_selected[attributeId])
	{
		var aus_form = getPageDoc();
		for (var i =0;i< aus_form.length;i++) if (aus_form.elements[i].name=="aus_form_changed") aus_form.elements[i].value=1;
		document.forms[formName].ButtonLoad.value = 1;
		disable_inputs();
		document.forms[formName].submit();
	}
]]>
<xsl:if test="$attrList/*/Dependency[@type='1']">
<![CDATA[	
	else
	{
		var aus_form = document.forms[formName];		
	    	var parentObject =  aus_get_form_object_from_name(attributeId);

	    	var child_name = aus_parent_child[attributeId];
	    	if(child_name)
	    	{
			if (document.forms[formName].elements[child_name+'_mvs'])
			{
				document.forms[formName].elements[child_name].style.color='black';
				document.forms[formName].elements[child_name].style.fontStyle='normal';
				document.forms[formName].elements[child_name].name=document.forms[formName].elements[child_name].name.substring(0,document.forms[formName].elements[child_name].name.length-4);
			}
		    	var childObject = aus_get_form_object_from_name(child_name);
		    	if(childObject)
			    	api_check_on_other(child_name, childObject.value);
		}
	}
]]>	
</xsl:if>
<![CDATA[	
	return;
}
]]>
</xsl:if>
				//</xsl:comment>
			</script>
	</xsl:template>
	<xsl:template name="JS_Arrays">
				<!-- Removed this because SYI code declares this in two places <script LANGUAGE="JavaScript1.1"> -->
var formName = '<xsl:value-of select="$formName"/>';
var attr15 = 'attr15';
var postInverse = 0;

<xsl:if test="$attrList/*/Dependency[@type='2']">
vvpSelectedValue = {<xsl:for-each select="$attrList/Attribute[*/@type='2']"><xsl:variable name="vvpAttrId" select="@id"/><xsl:variable name="vvpAttrVCSID" select="../../../@id"/>
"attr<xsl:value-of select="concat(../../../@id,'_')"/><xsl:value-of select="@id"/>" : "<xsl:value-of select="$returnAttr[../@id=$vvpAttrVCSID and @id=$vvpAttrId]/Value/@id"/>"<xsl:if test="not(position() = last())">,</xsl:if>
</xsl:for-each>
}

vvpArray = {<xsl:for-each select="$attrList/Attribute[*/@type='2']">
"attr<xsl:value-of select="concat(../../../@id,'_')"/><xsl:value-of select="@id"/>" : [<xsl:for-each select="Dependency[@type='2']">"<xsl:value-of select="@parentValueId"/>"<xsl:if test="not(position() = last())">,</xsl:if></xsl:for-each>]<xsl:if test="not(position() = last())">,</xsl:if>
</xsl:for-each>
}
</xsl:if>

<xsl:for-each select="$returnAttr">
					<xsl:variable name="getAttrId" select="@id"/>
					<xsl:variable name="getValueId" select="Value/@id"/>
					<xsl:if test="$attrData[@id=$getValueId]/*[@type='4' or @type='5']">
var attr<xsl:value-of select="$getAttrId"/> = 1;
</xsl:if>
				</xsl:for-each>
				<xsl:if test="$attrList/*/Dependency[@type='4']">
vvsp_choices = {<xsl:for-each select="$attrList/Attribute[*/@type='4']">
"attr<xsl:value-of select="concat(../../../@id,'_')"/><xsl:value-of select="@id"/>" : [ <xsl:for-each select="Dependency[@type='4']">"<xsl:value-of select="@parentValueId"/>"<xsl:if test="not(position() = last())">,</xsl:if>
						</xsl:for-each>]<xsl:if test="not(position() = last())">,</xsl:if>
					</xsl:for-each>
}

vvsp_choices2 = {<xsl:for-each select="$attrList/Attribute">
						<xsl:variable name="id" select="@id"/>
"attr<xsl:value-of select="concat(../../../@id,'_')"/><xsl:value-of select="@id"/>" : [ <xsl:for-each select="Dependency[@type='4']">"<xsl:value-of select="@parentValueId"/>"<xsl:if test="not(position() = last())">,</xsl:if>
						</xsl:for-each>]<xsl:if test="not(position() = last())">,</xsl:if>
					</xsl:for-each>
}
</xsl:if>

<xsl:if test="$attrList/*/Dependency[@type='1' or @type='2']">

aus_dependent_choices = {
<xsl:for-each select="$attrList/Attribute[*/@type[.='1' or .='2']]">
	<xsl:variable name="parentAttrId" select="@id"/>
	<xsl:variable name="vcsId" select="../../../@id"/>
	<xsl:variable name="DepAttributes" select="$attrList[../../@id=$vcsId]/Attribute[@parentAttrId=$parentAttrId]"/>
	<xsl:if test="position() != 1">,</xsl:if>
	<xsl:for-each select="$DepAttributes">
		<xsl:variable name="childAttrId" select="@id"/>
		<xsl:if test="not(position() = 1)">,</xsl:if>
		"attr<xsl:value-of select="concat(../../../@id,'_')"/><xsl:value-of select="@id"/>" : {<xsl:for-each select="$attrList[../../@id=$vcsId]/Attribute[@id=$parentAttrId]/Dependency[@type[.='1' or .='2'] and @childAttrId=$childAttrId]">
				<xsl:if test="not(position() = 1)">,</xsl:if>
				"attr<xsl:value-of select="@parentValueId"/>" : [ 	<xsl:for-each select="Value">["<xsl:choose><xsl:when test="DisplayName!=''"><xsl:call-template name="escapeQuot"><xsl:with-param name="text" select="DisplayName" /></xsl:call-template></xsl:when><xsl:otherwise><xsl:call-template name="escapeQuot"><xsl:with-param name="text" select="Name" /></xsl:call-template></xsl:otherwise></xsl:choose>","<xsl:value-of select="@id"/>" <xsl:if test="$returnAttr[../@id=$vcsId and @id = $childAttrId]/Value/@id = @id or IsDefault and not($returnAttr[../@id=$vcsId and @id = $childAttrId])">,"default"</xsl:if>]<xsl:if test="not(position() = last())">,</xsl:if>				
		</xsl:for-each>]</xsl:for-each>
	}</xsl:for-each>
</xsl:for-each>
}


aus_influencers = {<xsl:for-each select="$attrList/Attribute">
"attr<xsl:value-of select="concat(../../../@id,'_')"/><xsl:value-of select="@id"/>" : [<xsl:if test="@parentAttrId">"attr<xsl:value-of select="concat(../../../@id,'_')"/><xsl:value-of select="@id"/><xsl:value-of select="@parentAttrId"/>"</xsl:if>]<xsl:if test="not(position() = last())">,</xsl:if>
</xsl:for-each>
}

aus_parent_child = {<xsl:for-each select="$attrList/Attribute[*/@type='1' or */@type='2']">
"attr<xsl:value-of select="concat(../../../@id,'_')"/><xsl:value-of select="@id"/>" : [<xsl:call-template name="syiParentChild"/>]<xsl:if test="not(position() = last())">,</xsl:if>
</xsl:for-each>
}

aus_disabled_labels = {<xsl:for-each select="$attrList/Attribute">
<xsl:variable name="getId" select="@id"/>
"attr<xsl:value-of select="concat(../../../@id,'_',@id)"/>" : <xsl:choose>
<xsl:when test="$thisPI[@id=$getId]/InitialValue">"<xsl:value-of select="$thisPI[@id=$getId]/InitialValue"/>"</xsl:when>
<xsl:otherwise>"          "</xsl:otherwise>
</xsl:choose>
<xsl:if test="not(position() = last())">,</xsl:if>
</xsl:for-each>
}
aus_allow_other = {<xsl:for-each select="$attrList/Attribute">
<xsl:if test="not(*/Value)">
<xsl:if test="Dependency[@type='1']">
"<xsl:value-of select="@id"/>" : 1<xsl:if test="not(position() = last())">,</xsl:if>
</xsl:if>
</xsl:if>
</xsl:for-each>
}
</xsl:if>

aus_disabled_if_empty = {}

		<!-- Removed because SYI already wraps this beforehand </script> -->
	</xsl:template>

	<xsl:template name="JS_Arrays_pf">
	<STYLE TYPE="text/css">
			<![CDATA[.fielddisabled { BACKGROUND-COLOR: lightgrey; width:}
.fieldenabled { BACKGROUND-COLOR: white }]]>

		</STYLE>
	<script LANGUAGE="JavaScript1.1">
<xsl:if test="$attrList/*/Dependency[@type='4']">
vvsp_choices = {<xsl:for-each select="$attrList/Attribute[*/@type='4']">
"attr<xsl:value-of select="@id"/>" : [ <xsl:for-each select="Dependency[@type='4']">"<xsl:value-of select="@parentValueId"/>"<xsl:if test="not(position() = last())">,</xsl:if>
						</xsl:for-each>]<xsl:if test="not(position() = last())">,</xsl:if>
					</xsl:for-each>
}

vvsp_choices2 = {<xsl:for-each select="$attrList/Attribute">
						<xsl:variable name="id" select="@id"/>
"attr<xsl:value-of select="@id"/>" : [ <xsl:for-each select="Dependency[@type='4']">"<xsl:value-of select="@parentValueId"/>"<xsl:if test="not(position() = last())">,</xsl:if>
						</xsl:for-each>]<xsl:if test="not(position() = last())">,</xsl:if>
					</xsl:for-each>
}
</xsl:if>
<xsl:if test="$attrList/*/Dependency[@type='1' or @type='2']">
aus_dependent_choices = {<xsl:for-each select="$attrList/Attribute[*/@type='1']">
<xsl:variable name="parentAttrId" select="@id"/>
<xsl:for-each select="$attrList/Attribute[@parentAttrId=$parentAttrId]">
<xsl:variable name="childAttrId" select="@id"/>
"a<xsl:value-of select="@id"/>" : {<xsl:for-each select="$attrList/Attribute[@id=$parentAttrId]/Dependency[@type='1' and @childAttrId=$childAttrId]">
"a<xsl:value-of select="@parentValueId"/>" : [ <xsl:for-each select="Value">["<xsl:choose><xsl:when test="DisplayName!=''"><xsl:call-template name="escapeQuot"><xsl:with-param name="text" select="DisplayName" /></xsl:call-template></xsl:when><xsl:otherwise><xsl:call-template name="escapeQuot"><xsl:with-param name="text" select="Name" /></xsl:call-template></xsl:otherwise></xsl:choose>","<xsl:value-of select="@id"/>"]<xsl:if test="not(position() = last())">,</xsl:if>
</xsl:for-each>]<xsl:if test="not(position() = last())">,</xsl:if></xsl:for-each>
}<xsl:if test="not(position() = last())">,</xsl:if></xsl:for-each><xsl:if test="not(position() = last())">,</xsl:if>
</xsl:for-each>
}

aus_influencers = {<xsl:for-each select="$attrList/Attribute">
"<xsl:value-of select="InputFields/Input/@name"/>" : [<xsl:if test="@parentAttrId">"a<xsl:value-of select="@parentAttrId"/>"</xsl:if>]<xsl:if test="not(position() = last())">,</xsl:if>
</xsl:for-each>
}

aus_parent_child = {<xsl:for-each select="$attrList/Attribute[*/@type='1' or */@type='2']">
"a<xsl:value-of select="@id"/>" : [<xsl:call-template name="pfParentChild"/>]<xsl:if test="not(position() = last())">,</xsl:if>
</xsl:for-each>
}

aus_parent_child2 = {<xsl:for-each select="$attrList/Attribute[*/@type='1' or */@type='2']">
"a<xsl:value-of select="@id"/>" : [<xsl:call-template name="pfParentChild"/>]<xsl:if test="not(position() = last())">,</xsl:if>
</xsl:for-each>
}

aus_disabled_labels = {<xsl:for-each select="$attrList/Attribute">
<xsl:variable name="getId" select="@id"/>
"<xsl:value-of select="InputFields/Input/@name"/>" : <xsl:choose>
<xsl:when test="$thisPI[@id=$getId]/InitialValue">"<xsl:value-of select="$thisPI[@id=$getId]/InitialValue"/>"</xsl:when>
<xsl:otherwise>"          "</xsl:otherwise>
</xsl:choose>
<xsl:if test="not(position() = last())">,</xsl:if>
</xsl:for-each>
}
aus_allow_other = {<xsl:for-each select="$attrList/Attribute">
<xsl:if test="not(*/Value)">
<xsl:if test="Dependency[@type='1']">
"<xsl:value-of select="InputFields/Input/@name"/>" : 1<xsl:if test="not(position() = last())">,</xsl:if>
</xsl:if>
</xsl:if>
</xsl:for-each>
}
</xsl:if>
aus_disabled_if_empty = {}
</script>
</xsl:template>

<xsl:template name="syiParentChild">
	<xsl:for-each select="Dependency[@type='1' or @type='2']">
	<xsl:if test="position()=1">"attr<xsl:value-of select="concat(../../../../@id,'_')"/><xsl:value-of select="@childAttrId"/>","attr_hidden<xsl:value-of select="concat(../../../../@id,'_')"/><xsl:value-of select="@childAttrId"/>"</xsl:if>
	<xsl:if test="@childAttrId != preceding-sibling::Dependency[1]/@childAttrId">,"attr<xsl:value-of select="concat(../../../../@id,'_')"/><xsl:value-of select="@childAttrId"/>","attr_hidden<xsl:value-of select="concat(../../../../@id,'_')"/><xsl:value-of select="@childAttrId"/>"</xsl:if>
	</xsl:for-each>
</xsl:template>
<xsl:template name="pfParentChild">
	<xsl:for-each select="Dependency[@type='1' or @type='2']">
	<xsl:if test="position()=1">"a<xsl:value-of select="@childAttrId"/>"</xsl:if>
	<xsl:if test="@childAttrId != preceding-sibling::Dependency[1]/@childAttrId">,"a<xsl:value-of select="@childAttrId"/>"</xsl:if>
	</xsl:for-each>
</xsl:template>

	<xsl:template match="Label">
		<xsl:param name="attrId"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:choose>
			<xsl:when test="@bold='true' and @italic='true'">
				<b>
					<i>
						<xsl:call-template name="WriteLabel">
							<xsl:with-param name="attrId" select="$attrId"/>
							<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
						</xsl:call-template>
					</i>
				</b>
			</xsl:when>
			<xsl:when test="@bold='true'">
				<b>
					<xsl:call-template name="WriteLabel">
						<xsl:with-param name="attrId" select="$attrId"/>
						<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
					</xsl:call-template>
				</b>
			</xsl:when>
			<xsl:when test="@italic='true'">
				<i>
					<xsl:call-template name="WriteLabel">
						<xsl:with-param name="attrId" select="$attrId"/>
						<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
					</xsl:call-template>
				</i>
			</xsl:when>
			<xsl:otherwise>
				<xsl:call-template name="WriteLabel">
					<xsl:with-param name="attrId" select="$attrId"/>
					<xsl:with-param name="CurrentAttributeXPath" select="$CurrentAttributeXPath"/>
				</xsl:call-template>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template name="WriteLabel">
		<xsl:param name="attrId"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:variable name="parentAttrIdLabel" select="$CurrentAttributeXPath[Dependency/@childAttrId=$attrId]/@id"/>
		<font>		
			<xsl:choose>
				<xsl:when test="$subPage='API'">
					<xsl:copy-of select="@*"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:attribute name="face"><xsl:value-of select="@face"/></xsl:attribute>
					<xsl:attribute name="size"><xsl:value-of select="@size"/></xsl:attribute>
					<xsl:attribute name="color"><xsl:value-of select="@color"/></xsl:attribute>
				</xsl:otherwise>
			</xsl:choose>
			<xsl:choose>
				<xsl:when test="../@helpId != ''">
					<xsl:variable name="BaseHtmlPath">
						<xsl:value-of select="/eBay/GlobalSettings/BaseHTMLPath" />
					</xsl:variable>
					<a href="{$BaseHtmlPath}/help/attrhelp/contextual/{../@helpId}.html" onclick="javascript:var w=window.open(this.href, 'helpwin', 'resizable=yes,scrollbars,width=440,height=500,top=0,left='+(screen.availWidth-450)); w.focus(); return false;" target="helpwin">
						<xsl:choose>
							<xsl:when test=".!=''">
								<xsl:value-of select="."/>
							</xsl:when>
							<xsl:otherwise>
								<xsl:value-of select="$CurrentAttributeXPath[@id = $attrId]/Label"/>
							</xsl:otherwise>
						</xsl:choose>
					</a>
				</xsl:when>
				<xsl:when test="../Link">
					<a href="{../Link}">
						<xsl:choose>
							<xsl:when test=".!=''">
								<xsl:value-of select="."/>
							</xsl:when>
							<xsl:otherwise>
								<xsl:value-of select="$CurrentAttributeXPath[@id = $attrId]/Label"/>
							</xsl:otherwise>
						</xsl:choose>
					</a>
				</xsl:when>
				<xsl:when test="$CurrentAttributeXPath[@id = $attrId]/HasGlossary">
					<a href="{$CurrentAttributeXPath[@id = $attrId]/HelpText}" onclick="return openContextualHelpWindow(this.href);" target="helpwin">
						<xsl:if test="$subPage='API'">
							<xsl:attribute name="onclick"/>
						</xsl:if>
						<xsl:choose>
							<xsl:when test=".!=''">
								<xsl:value-of select="."/>
							</xsl:when>
							<xsl:otherwise>
								<xsl:value-of select="$CurrentAttributeXPath[@id = $attrId]/Label"/>
							</xsl:otherwise>
						</xsl:choose>
					</a>
				</xsl:when>
				<xsl:otherwise>
					<xsl:choose>
						<xsl:when test=".='spacer'">&#160;</xsl:when>
						<xsl:when test=".!=''">
							<xsl:value-of disable-output-escaping="yes" select="."/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:choose>
								<xsl:when test="$CurrentAttributeXPath[@id = $attrId][Label!='']">
									<xsl:value-of disable-output-escaping="yes" select="$CurrentAttributeXPath[@id = $attrId]/Label"/>
								</xsl:when>
								<xsl:otherwise><xsl:choose><xsl:when test="$thisPage='SYI'">&#160;</xsl:when><xsl:otherwise></xsl:otherwise></xsl:choose></xsl:otherwise>
							</xsl:choose>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:otherwise>
			</xsl:choose>
			<xsl:if test="$CurrentAttributeXPath[@id = $attrId and @IsRequired='true'] or $CurrentAttributeXPath[@id=$parentAttrIdLabel]/Dependency[@childAttrId=$attrId and @type='5']">&#160;<xsl:copy-of select="$attrAsterisk"/></xsl:if>
		</font></xsl:template><!--DT: leave this closing tag on same line as font closing tag, this is to prevent carriage return with the td tag -->
	<xsl:template name="SingleMultiple">
		<xsl:param name="attrId"/>
		<xsl:param name="inputName"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:param name="VCSID"/>
		<xsl:choose>
			<xsl:when test="$thisPage='SYI'">
				<xsl:variable name="syiParentAttrId" select="$CurrentAttributeXPath[Dependency/@childAttrId=$attrId]/@id"/>
				<select>
					<xsl:choose>
						<xsl:when test="@size">
							<xsl:attribute name="size"><xsl:value-of select="@size"/></xsl:attribute>
						</xsl:when>
						<xsl:otherwise>
							<xsl:attribute name="size">4</xsl:attribute>
						</xsl:otherwise>
					</xsl:choose>
					<xsl:if test="@type='multiple'">
						<xsl:attribute name="multiple">multiple</xsl:attribute>
					</xsl:if>
					<!-- onChange-->
					<xsl:choose>
						<xsl:when test="$subPage = 'API' and $CurrentAttributeXPath[@id=$attrId]/Dependency[@type = '4' or @type = '5']">
							<xsl:attribute name="onChange"><xsl:if test="$CurrentAttributeXPath[@id=$attrId]/Dependency[@type='1']">aus_set_parent('attr<xsl:value-of select="concat($VCSID,'_',$attrId)"/>', this.value); </xsl:if> vvsp_check('attr<xsl:value-of select="concat($VCSID,'_',$attrId)"/>', this.value);</xsl:attribute>
						</xsl:when>
						<xsl:when test="$CurrentAttributeXPath[@id=$attrId]/Dependency[@type='1']">
							<xsl:attribute name="onChange">aus_set_parent('attr<xsl:value-of select="concat($VCSID,'_',$attrId)"/>',1);<xsl:if test="$subPage = 'API' ">api_check_on_other('attr<xsl:value-of select="concat($VCSID,'_',$attrId)"/>',this.value);</xsl:if></xsl:attribute>
						</xsl:when>
						<xsl:when test="$CurrentAttributeXPath[@id=$attrId]/Dependency[@type='2']">
							<xsl:attribute name="onChange">vvpPost('attr<xsl:value-of select="concat($VCSID,'_',$attrId)"/>',this.value);<xsl:if test="$subPage = 'API' ">api_check_on_other('attr<xsl:value-of select="concat($VCSID,'_',$attrId)"/>',this.value);</xsl:if></xsl:attribute>
						</xsl:when>
						<xsl:when test="$subPage = 'API' ">
							<xsl:attribute name="onChange">api_check_on_other('attr<xsl:value-of select="concat($VCSID,'_',$attrId)"/>',this.value);</xsl:attribute>
						</xsl:when>
						<xsl:otherwise/>
					</xsl:choose>
					<xsl:variable name="FieldName" select="concat('attr',$VCSID,'_',$attrId)"/>
					<xsl:attribute name="name"><xsl:value-of select="$FieldName"/></xsl:attribute>
					<xsl:choose>
						<xsl:when test="$syiParentAttrId">
							<xsl:choose>
								<xsl:when test="$CurrentAttributeXPath[@id=$syiParentAttrId]/*[@isVisible='true']">
									<!--<xsl:for-each select="$attrData[@id=$syiParentAttrId]/Dependency[(@type='1' or @type='2' or @type='3') and @childAttrId=$attrId and @isVisible='true']">-->
									<xsl:apply-templates select="$CurrentAttributeXPath[@id=$syiParentAttrId]/Dependency[(@type='1' or @type='2' or @type='3') and @childAttrId=$attrId and @isVisible='true']" mode="isVisible">
										<xsl:with-param name="attrId" select="$attrId"/>
										<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
										<xsl:with-param name="FieldName" select="$FieldName"/>
									</xsl:apply-templates>
									<!--</xsl:for-each>-->
								</xsl:when>
								<xsl:otherwise>
									<xsl:variable name="syiParentValueId" select="$SelectedAttributeXPath[@id=$syiParentAttrId]/Value/@id"/>
									<xsl:choose>
										<xsl:when test="$subPage='API' and $CurrentAttributeXPath[@id=$syiParentAttrId]/Dependency[(@type='3' or @type='4' or @type='5') and @parentValueId=$syiParentValueId and @childAttrId=$attrId]">
											<xsl:apply-templates select="$CurrentAttributeXPath[@id=$attrId]/ValueList/Value | $CurrentAttributeXPath[@id=$syiParentAttrId]/Dependency[@parentValueId=$syiParentValueId and @childAttrId=$attrId]/Value[count(. | key('attrByIDs', concat($VCSID, '_', key('selectedAttrByIDs', concat($VCSID, '_', $syiParentAttrId, '_', $syiParentValueId))/@id, '_', @id))[1])=1]">
												<xsl:sort select="@id"/>
												<xsl:with-param name="attrId" select="$attrId"/>
												<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
												<xsl:with-param name="FieldName" select="$FieldName"/>
											</xsl:apply-templates>
										</xsl:when>
										<xsl:when test="$syiParentValueId and $CurrentAttributeXPath[@id=$syiParentAttrId]/Dependency[@type='1' or @type='2']">
											<xsl:apply-templates select="$CurrentAttributeXPath[@id=$syiParentAttrId]/Dependency[@parentValueId=$syiParentValueId]" mode="dep">
												<xsl:with-param name="attrId" select="$attrId"/>
												<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
												<xsl:with-param name="FieldName" select="$FieldName"/>
											</xsl:apply-templates>
										</xsl:when>
									</xsl:choose>
								</xsl:otherwise>
							</xsl:choose>
						</xsl:when>
						<xsl:otherwise>
							<xsl:apply-templates select="$CurrentAttributeXPath[@id=$attrId]/ValueList/Value">
								<xsl:with-param name="attrId" select="$attrId"/>
								<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
								<xsl:with-param name="FieldName" select="$FieldName"/>
							</xsl:apply-templates>
						</xsl:otherwise>
					</xsl:choose>
				</select>
			</xsl:when>
			<xsl:otherwise>
				<!-- This flow is never used by API and SYI -->
				<xsl:variable name="pfId" select="$CurrentAttributeXPath[@id=$attrId]/InputFields/Input/Value/@pfId"/>
				<xsl:variable name="pfPageType" select="$CurrentAttributeXPath[@id=$attrId]/InputFields/Input/Value/@pfPageType"/>
				<xsl:variable name="selectedValue" select="$CurrentAttributeXPath[@id=$attrId]/InputFields/Input/Value/@id"/>
				<xsl:variable name="parentAttrId" select="$attrData[@id=$attrId]/@parentAttrId"/>
				<select>
					<xsl:choose>
						<xsl:when test="@display_size">
							<xsl:attribute name="size"><xsl:value-of select="@display_size"/></xsl:attribute>
						</xsl:when>
						<xsl:otherwise>
							<xsl:attribute name="size">4</xsl:attribute>
						</xsl:otherwise>
					</xsl:choose>
					<xsl:if test="@type='multiple'">
						<xsl:attribute name="multiple">multiple</xsl:attribute>
					</xsl:if>
					<xsl:attribute name="name"><xsl:value-of select="$inputName"/></xsl:attribute>
					<xsl:attribute name="class"><xsl:value-of select="$inputName"/></xsl:attribute>
					<xsl:if test="$attrData[@id=$attrId]/Dependency/@type='1'">
						<xsl:attribute name="onChange">aus_set_parent('<xsl:value-of select="$inputName"/>',1);</xsl:attribute>
					</xsl:if>
					<xsl:choose>
						<xsl:when test="$parentAttrId">
							<xsl:variable name="parentValueId" select="$returnAttr[@id=$parentAttrId]/InputFields/Input/Value/@id"/>
							<xsl:choose>
								<xsl:when test="$parentValueId != '-24'">
									<xsl:choose>
										<xsl:when test="$attrData[@id=$parentAttrId]/Dependency[@parentValueId=$parentValueId and @childAttrId=$attrId]">
											<xsl:apply-templates select="$attrData[@id=$parentAttrId]/Dependency[@parentValueId=$parentValueId and @childAttrId=$attrId]/Value" mode="dep"/>
										</xsl:when>
										<xsl:otherwise>
											<script LANGUAGE="JavaScript1.1">
												var thisChild = "a<xsl:value-of select="$attrId"/>"; //if child does not have dep valuelist, then disable it.
												aus_disable_child(thisChild);
											</script>
											<xsl:call-template name="EmptyDropdown"/>
										</xsl:otherwise>
									</xsl:choose>
								</xsl:when>
								<xsl:otherwise>
									<xsl:call-template name="EmptyDropdown"/>
								</xsl:otherwise>
							</xsl:choose>
						</xsl:when>
						<xsl:otherwise>
							<xsl:apply-templates select="$attrData[@id=$attrId]/ValueList/Value">
								<xsl:with-param name="selectedValue" select="$attrData[@id=$attrId]/InputFields/Input/Value/@id"/>
								<xsl:with-param name="pfId" select="$pfId"/>
								<xsl:with-param name="pfPageType" select="$pfPageType"/>
								<xsl:with-param name="type" select="@type"/>
							</xsl:apply-templates>
							<xsl:if test="@type='single' and $pfId and $pfPageType">
								<option value="{$selectedValue}" selected="selected">
									<xsl:choose>
										<xsl:when test="$attrData[@id=$attrId]/InputFields/Input/Value[DisplayName!='']">
											<xsl:value-of select="$attrData[@id=$attrId]/InputFields/Input/Value/DisplayName"/>
										</xsl:when>
										<xsl:otherwise>
											<xsl:value-of select="$attrData[@id=$attrId]/InputFields/Input/Value/Name"/>
										</xsl:otherwise>
									</xsl:choose>
								</option>
							</xsl:if>
						</xsl:otherwise>
					</xsl:choose>
				</select>
				<xsl:if test="$pfId and $pfPageType">
					<input type="hidden">
						<xsl:attribute name="name">sovcf_<xsl:value-of select="$attrId"/>_<xsl:value-of select="$selectedValue"/></xsl:attribute>
						<xsl:attribute name="value"><xsl:value-of select="$pfId"/>_<xsl:value-of select="$pfPageType"/></xsl:attribute>
					</input>
				</xsl:if>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template name="DisplayMessage">
		<xsl:param name="attrMessage"/>
		<xsl:param name="messageStyle"/>
		<xsl:param name="attrId"/>
		<xsl:if test="$attrMessage and $attrMessage != '' ">
			<xsl:variable name="size">
				<xsl:choose>
					<xsl:when test="$messageStyle/@size">
						<xsl:value-of select="$messageStyle/@size"/>
					</xsl:when>
					<xsl:otherwise>2</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>		
			<xsl:variable name="color">
				<xsl:choose>
					<xsl:when test="$messageStyle/@color">
						<xsl:value-of select="$messageStyle/@color"/>
					</xsl:when>
					<xsl:otherwise>#000000</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>		
			<xsl:variable name="face">
				<xsl:choose>
					<xsl:when test="$messageStyle/@face">
						<xsl:value-of select="$messageStyle/@face"/>
					</xsl:when>
					<xsl:otherwise>Verdana,Geneva,Arial,Helvetica</xsl:otherwise>
				</xsl:choose>
			</xsl:variable>		
			<font face="{$face}" size="{$size}" color="{$color}">
				<xsl:if test="$subPage = 'API' ">
					<xsl:choose>
						<xsl:when test="$messageStyle">
							<xsl:copy-of select="$messageStyle/@*"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:copy-of select="$fonts[@id = 'message-style-default' ]/@*"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:if>
				<xsl:choose>
					<xsl:when test="contains($attrMessage, '&lt;A ')">
						<xsl:value-of disable-output-escaping="yes" select="concat(substring-before($attrMessage, '&lt;A '), '&lt;A target=_new ', substring-after($attrMessage, '&lt;A '))"/>
					</xsl:when>
					<xsl:when test="contains($attrMessage, '&lt;a ')">
						<xsl:value-of disable-output-escaping="yes" select="concat(substring-before($attrMessage, '&lt;a '), '&lt;a target=_new ', substring-after($attrMessage, '&lt;a '))"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of disable-output-escaping="yes" select="$attrMessage"/>
					</xsl:otherwise>
				</xsl:choose>
			</font></xsl:if><!-- JO: do not add extra white space between end of font tag and end if -->
	</xsl:template>
	<xsl:template match="TextMessage">
		<tr>
			<td>
				<font>
					<xsl:choose>
						<xsl:when test="$fonts[@id='default']/@*">
							<xsl:copy-of select="$fonts[@id='default']/@*"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:copy-of select="@*"/>
						</xsl:otherwise>
					</xsl:choose>
					<xsl:choose>
						<xsl:when test="contains(., '&lt;A ')">
							<xsl:value-of disable-output-escaping="yes" select="concat(substring-before(., '&lt;A '), '&lt;A target=_new ', substring-after(., '&lt;A '))"/>
						</xsl:when>
						<xsl:when test="contains(., '&lt;a ')">
							<xsl:value-of disable-output-escaping="yes" select="concat(substring-before(., '&lt;a '), '&lt;a target=_new ', substring-after(., '&lt;a '))"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of disable-output-escaping="yes" select="."/>
						</xsl:otherwise>
					</xsl:choose>
				</font></td>
		</tr>
		<tr>
			<xsl:call-template name="TableSpacerCell">
				<xsl:with-param name="height" select="10"/>								
				<xsl:with-param name="width" select="'' "/>
				<xsl:with-param name="colspan" select="'' "/>
				<xsl:with-param name="rowspan" select=" '' "/>
			</xsl:call-template>
		</tr>
	</xsl:template>
	<xsl:template match="Message">
		<xsl:choose>
			<xsl:when test="@type='error'">
				<br/>
				<font color="red" size="1">Error! Code: <xsl:value-of disable-output-escaping="yes" select="."/>
				</font>
			</xsl:when>
			<xsl:when test="@type='normal'">
				<br/>
				<font size="1">
					<xsl:value-of disable-output-escaping="yes" select="."/>
				</font>
			</xsl:when>
		</xsl:choose>
	</xsl:template>
	<xsl:template match="ValueList/Value">
		<xsl:param name="attrId"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="FieldName"/>
		
		<xsl:variable name="valueId" select="@id"/>
		<option value="{@id}">
			<xsl:choose>
				<xsl:when test="$UsePostedFormFields">					
					<xsl:if test="$valueId = $FormFields/FormField[@name = $FieldName]/Value">
						<xsl:attribute name="selected">selected</xsl:attribute>
					</xsl:if>
				</xsl:when>
				<xsl:otherwise>
					<xsl:if test="$SelectedAttributeXPath[@id=$attrId]/Value[@id=$valueId] or (not($SelectedAttributeXPath) and IsDefault) or (not($SelectedAttributeXPath[@id=$attrId]/Value) and IsDefault)">
						<xsl:attribute name="selected">selected</xsl:attribute>
					</xsl:if>
				</xsl:otherwise>
			</xsl:choose>			
			<xsl:choose>
				<xsl:when test="DisplayName"><!-- for multi-units -->
					<xsl:value-of select="DisplayName"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="Name"/>
				</xsl:otherwise>
			</xsl:choose>
		</option>
	</xsl:template>
	<xsl:template match="Dependency" mode="isVisible">
		<xsl:param name="attrId"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="FieldName"/>
		<xsl:apply-templates select="Value" mode="dep">
			<xsl:with-param name="attrId" select="$attrId"/>
			<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
			<xsl:with-param name="FieldName" select="$FieldName"/>
		</xsl:apply-templates>
	</xsl:template>
	<!-- 
		Not used in API
	-->
	<xsl:template match="Dependency" mode="dep">
		<xsl:param name="attrId"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="FieldName"/>
		
		<xsl:variable name="depValue">
			<xsl:choose>			
				<xsl:when test="$UsePostedFormFields">					
					<xsl:value-of select="$FormFields/FormField[@name = $FieldName]/Value"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="$SelectedAttributeXPath[@id=$attrId]/Value"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		
		<xsl:choose>
			<xsl:when test="$depValue or @type='2'">
				<xsl:apply-templates select="Value" mode="dep">
					<xsl:with-param name="attrId" select="$attrId"/>
					<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
					<xsl:with-param name="FieldName" select="$FieldName"/>
				</xsl:apply-templates>
			</xsl:when>
			<xsl:otherwise>
				<option value="-10">- &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; </option>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<!-- 
		Not used in API
	-->
	<xsl:template match="Value" mode="dep">
		<xsl:param name="attrId"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="FieldName"/>
		
		<xsl:variable name="valueId" select="@id"/>
		<option value="{@id}">
			<xsl:choose>			
				<xsl:when test="$UsePostedFormFields">					
					<xsl:if test="$valueId = $FormFields/FormField[@name = $FieldName]/Value">
						<xsl:attribute name="selected">selected</xsl:attribute>
					</xsl:if>
				</xsl:when>
				<xsl:otherwise>
					<xsl:if test="$SelectedAttributeXPath[@id=$attrId]/Value[@id=$valueId] or (not($SelectedAttributeXPath) and IsDefault) or (not($SelectedAttributeXPath[@id=$attrId]/Value) and IsDefault)">
						<xsl:attribute name="selected">selected</xsl:attribute>
					</xsl:if>
				</xsl:otherwise>
			</xsl:choose>
			<xsl:value-of select="."/>
		</option>
	</xsl:template>
	<xsl:template name="EmptyDropdown">
			<option value="-10">- &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; </option>
	<option value="-10">- &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; </option>
	<option value="-10">- &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; </option>
	<option value="-10">- &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; </option>
	<option value="-10">- &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; </option>
	<option value="-10">- &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; </option>
	<option value="-10">- &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; </option>
	<option value="-10">- &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; </option>
	<option value="-10">- &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; </option>
	<option value="-10">- &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; &#160; </option>
	</xsl:template>
	<xsl:template name="TextField">
		<xsl:param name="attrId"/>
		<xsl:param name="inputName"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:param name="VCSID"/>
		<xsl:choose>
			<xsl:when test="../../@type='date'">
				<xsl:variable name="currentMonth">
					<xsl:call-template name="get_current_date_string">
						<xsl:with-param name="date_part" select="'Month'"/>
						<xsl:with-param name="date" select="$CurrentAttributeXPath[@id=$attrId]/CurrentTime/DateMedium"/>
					</xsl:call-template>
				</xsl:variable>
				<xsl:variable name="currentDay">
					<xsl:call-template name="get_current_date_string">
						<xsl:with-param name="date_part" select="'Day'"/>
						<xsl:with-param name="date" select="$CurrentAttributeXPath[@id=$attrId]/CurrentTime/DateMedium"/>
					</xsl:call-template>
				</xsl:variable>
				<xsl:variable name="currentYear">
					<xsl:call-template name="get_current_date_string">
						<xsl:with-param name="date_part" select="'Year'"/>
						<xsl:with-param name="date" select="$CurrentAttributeXPath[@id=$attrId]/CurrentTime/DateMedium"/>
					</xsl:call-template>
				</xsl:variable>
				<xsl:variable name="day">
					<xsl:choose>
						<xsl:when test="../CurrentDate">
							<xsl:value-of select="$currentDay"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:choose>
								<xsl:when test="$thisPage='PF'">
									<xsl:value-of select="$returnAttr[@id=$attrId]/InputFields/Input[@dataType='D']/Value/Name"/>
								</xsl:when>
								<xsl:otherwise>
									<xsl:value-of select="$SelectedAttributeXPath[@id=$attrId]/Value/Day"/>
								</xsl:otherwise>
							</xsl:choose>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<xsl:variable name="month">
					<xsl:choose>
						<xsl:when test="../CurrentDate">
							<xsl:value-of select="$currentMonth"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:choose>
								<xsl:when test="$thisPage='PF'">
									<xsl:value-of select="$returnAttr[@id=$attrId]/InputFields/Input[@dataType='M']/Value/Name"/>
								</xsl:when>
								<xsl:otherwise>
									<xsl:value-of select="$SelectedAttributeXPath[@id=$attrId]/Value/Month"/>
								</xsl:otherwise>
							</xsl:choose>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<xsl:variable name="year">
					<xsl:choose>
						<xsl:when test="../CurrentDate">
							<xsl:value-of select="$currentYear"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:choose>
								<xsl:when test="$thisPage='PF'">
									<xsl:value-of select="$returnAttr[@id=$attrId]/InputFields/Input[@dataType='Y']/Value/Name"/>
								</xsl:when>
								<xsl:otherwise>
									<xsl:value-of select="$SelectedAttributeXPath[@id=$attrId]/Value/Year"/>
								</xsl:otherwise>
							</xsl:choose>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<xsl:variable name="CurDateFormat" select="translate($CurrentAttributeXPath[@id=$attrId]/@dateFormat,'.-/_, ','')"/>
				<xsl:variable name="CurFormat" select="translate(@format,'.-/_, ','')"/>
				<xsl:choose>
					<xsl:when test="$CurDateFormat='dmY' or $CurDateFormat='dMY' or $CurFormat='dmy'">
						<!--Remove @format for all subsequent "when" after phase b rolls out and stable-->
						<table cellpadding="0" cellspacing="0" border="0">
							<tr>
								<td/>
								<td>
									<xsl:if test="../Day/@quadrant='top'">
										<font face="{../Day/@face}" size="{../Day/@size}" color="{../Day/@color}">
											<xsl:value-of select="../Day"/>
										</font>
									</xsl:if>
								</td>
								<td/>
								<td/>
								<td>
									<xsl:if test="../Month/@quadrant='top'">
										<font face="{../Month/@face}" size="{../Month/@size}" color="{../Month/@color}">
											<xsl:value-of select="../Month"/>
										</font>
									</xsl:if>
								</td>
								<td/>
								<td/>
								<td>
									<xsl:if test="../Year/@quadrant='top'">
										<font face="{../Year/@face}" size="{../Year/@size}" color="{../Year/@color}">
											<xsl:value-of select="../Year"/>
										</font>
									</xsl:if>
								</td>
								<td/>
							</tr>
							<tr>
								<td>
									<xsl:if test="../Day/@quadrant='left'">
										<font face="{../Day/@face}" size="{../Day/@size}" color="{../Day/@color}">
											<xsl:value-of select="../Day"/>
										</font>
									</xsl:if>
								</td>
								<td>
									<xsl:call-template name="Textbox_Day">
										<xsl:with-param name="attrId" select="$attrId"/>
										<xsl:with-param name="inputNameDay" select="$CurrentAttributeXPath[@id=$attrId]/InputFields/Input[@dataType='D']/@name"/>
										<xsl:with-param name="day" select="$day"/>
										<xsl:with-param name="VCSID" select="$VCSID"/>
										<xsl:with-param name="mvs" select="$SelectedAttributeXPath[@id=$attrId]/@mvs"/>
									</xsl:call-template>
								</td>
								<td>
									<xsl:if test="../Day/@quadrant='right'">
										<font face="{../Day/@face}" size="{../Day/@size}" color="{../Day/@color}">
											<xsl:value-of select="../Day"/>
										</font>
									</xsl:if>
								</td>
								<td>
									<xsl:if test="../Month/@quadrant='left'">
										<font face="{../Month/@face}" size="{../Month/@size}" color="{../Month/@color}">
											<xsl:value-of select="../Month"/>
										</font>
									</xsl:if>
								</td>
								<td>
									<xsl:call-template name="Textbox_Month">
										<xsl:with-param name="attrId" select="$attrId"/>
										<xsl:with-param name="inputNameMonth" select="$CurrentAttributeXPath[@id=$attrId]/InputFields/Input[@dataType='M']/@name"/>
										<xsl:with-param name="month" select="$month"/>
										<xsl:with-param name="VCSID" select="$VCSID"/>
										<xsl:with-param name="mvs" select="$SelectedAttributeXPath[@id=$attrId]/@mvs"/>
									</xsl:call-template>
								</td>
								<td>
									<xsl:if test="../Month/@quadrant='right'">
										<font face="{../Month/@face}" size="{../Month/@size}" color="{../Month/@color}">
											<xsl:value-of select="../Month"/>
										</font>
									</xsl:if>
								</td>
								<td>
									<xsl:if test="../Year/@quadrant='left'">
										<font face="{../Year/@face}" size="{../Year/@size}" color="{../Year/@color}">
											<xsl:value-of select="../Year"/>
										</font>
									</xsl:if>
								</td>
								<td>
									<xsl:call-template name="Textbox_Year">
										<xsl:with-param name="attrId" select="$attrId"/>
										<xsl:with-param name="inputNameYear" select="$CurrentAttributeXPath[@id=$attrId]/InputFields/Input[@dataType='Y']/@name"/>
										<xsl:with-param name="year" select="$year"/>
										<xsl:with-param name="VCSID" select="$VCSID"/>
										<xsl:with-param name="mvs" select="$SelectedAttributeXPath[@id=$attrId]/@mvs"/>
									</xsl:call-template>
								</td>
								<td>
									<xsl:if test="../Year/@quadrant='right'">
										<font face="{../Year/@face}" size="{../Year/@size}" color="{../Year/@color}">
											<xsl:value-of select="../Year"/>
										</font>
									</xsl:if>
								</td>
							</tr>
							<tr>
								<td/>
								<td>
									<xsl:if test="../Day/@quadrant='bottom'">
										<font face="{../Day/@face}" size="{../Day/@size}" color="{../Day/@color}">
											<xsl:value-of select="../Day"/>
										</font>
									</xsl:if>
								</td>
								<td/>
								<td/>
								<td>
									<xsl:if test="../Month/@quadrant='bottom'">
										<font face="{../Month/@face}" size="{../Month/@size}" color="{../Month/@color}">
											<xsl:value-of select="../Month"/>
										</font>
									</xsl:if>
								</td>
								<td/>
								<td/>
								<td>
									<xsl:if test="../Year/@quadrant='bottom'">
										<font face="{../Year/@face}" size="{../Year/@size}" color="{../Year/@color}">
											<xsl:value-of select="../Year"/>
										</font>
									</xsl:if>
								</td>
								<td/>
							</tr>
						</table>
					</xsl:when>
					<xsl:when test="$CurDateFormat='mdY' or $CurDateFormat='MdY' or $CurFormat='mdy'">
						<table cellpadding="0" cellspacing="0" border="0">
							<tr>
								<td/>
								<td>
									<xsl:if test="../Month/@quadrant='top'">
										<font face="{../Month/@face}" size="{../Month/@size}" color="{../Month/@color}">
											<xsl:value-of select="../Month"/>
										</font>
									</xsl:if>
								</td>
								<td/>
								<td/>
								<td>
									<xsl:if test="../Day/@quadrant='top'">
										<font face="{../Day/@face}" size="{../Day/@size}" color="{../Day/@color}">
											<xsl:value-of select="../Day"/>
										</font>
									</xsl:if>
								</td>
								<td/>
								<td/>
								<td>
									<xsl:if test="../Year/@quadrant='top'">
										<font face="{../Year/@face}" size="{../Year/@size}" color="{../Year/@color}">
											<xsl:value-of select="../Year"/>
										</font>
									</xsl:if>
								</td>
								<td/>
							</tr>
							<tr>
								<td>
									<xsl:if test="../Month/@quadrant='left'">
										<font face="{../Month/@face}" size="{../Month/@size}" color="{../Month/@color}">
											<xsl:value-of select="../Month"/>
										</font>
									</xsl:if>
								</td>
								<td>
									<xsl:call-template name="Textbox_Month">
										<xsl:with-param name="attrId" select="$attrId"/>
										<xsl:with-param name="inputNameMonth" select="$CurrentAttributeXPath[@id=$attrId]/InputFields/Input[@dataType='M']/@name"/>
										<xsl:with-param name="month" select="$month"/>
										<xsl:with-param name="VCSID" select="$VCSID"/>
										<xsl:with-param name="mvs" select="$SelectedAttributeXPath[@id=$attrId]/@mvs"/>
									</xsl:call-template>
								</td>
								<td>
									<xsl:if test="../Month/@quadrant='right'">
										<font face="{../Month/@face}" size="{../Month/@size}" color="{../Month/@color}">
											<xsl:value-of select="../Month"/>
										</font>
									</xsl:if>
								</td>
								<td>
									<xsl:if test="../Day/@quadrant='left'">
										<font face="{../Day/@face}" size="{../Day/@size}" color="{../Day/@color}">
											<xsl:value-of select="../Day"/>
										</font>
									</xsl:if>
								</td>
								<td>
									<xsl:call-template name="Textbox_Day">
										<xsl:with-param name="attrId" select="$attrId"/>
										<xsl:with-param name="inputNameDay" select="$CurrentAttributeXPath[@id=$attrId]/InputFields/Input[@dataType='D']/@name"/>
										<xsl:with-param name="day" select="$day"/>
										<xsl:with-param name="VCSID" select="$VCSID"/>
										<xsl:with-param name="mvs" select="$SelectedAttributeXPath[@id=$attrId]/@mvs"/>
									</xsl:call-template>
								</td>
								<td>
									<xsl:if test="../Day/@quadrant='right'">
										<font face="{../Day/@face}" size="{../Day/@size}" color="{../Day/@color}">
											<xsl:value-of select="../Day"/>
										</font>
									</xsl:if>
								</td>
								<td>
									<xsl:if test="../Year/@quadrant='left'">
										<font face="{../Year/@face}" size="{../Year/@size}" color="{../Year/@color}">
											<xsl:value-of select="../Year"/>
										</font>
									</xsl:if>
								</td>
								<td>
									<xsl:call-template name="Textbox_Year">
										<xsl:with-param name="attrId" select="$attrId"/>
										<xsl:with-param name="inputNameYear" select="$CurrentAttributeXPath[@id=$attrId]/InputFields/Input[@dataType='Y']/@name"/>
										<xsl:with-param name="year" select="$year"/>
										<xsl:with-param name="VCSID" select="$VCSID"/>
										<xsl:with-param name="mvs" select="$SelectedAttributeXPath[@id=$attrId]/@mvs"/>
									</xsl:call-template>
								</td>
								<td>
									<xsl:if test="../Year/@quadrant='right'">
										<font face="{../Year/@face}" size="{../Year/@size}" color="{../Year/@color}">
											<xsl:value-of select="../Year"/>
										</font>
									</xsl:if>
								</td>
							</tr>
							<tr>
								<td/>
								<td>
									<xsl:if test="../Month/@quadrant='bottom'">
										<font face="{../Month/@face}" size="{../Month/@size}" color="{../Month/@color}">
											<xsl:value-of select="../Month"/>
										</font>
									</xsl:if>
								</td>
								<td/>
								<td/>
								<td>
									<xsl:if test="../Day/@quadrant='bottom'">
										<font face="{../Day/@face}" size="{../Day/@size}" color="{../Day/@color}">
											<xsl:value-of select="../Day"/>
										</font>
									</xsl:if>
								</td>
								<td/>
								<td/>
								<td>
									<xsl:if test="../Year/@quadrant='bottom'">
										<font face="{../Year/@face}" size="{../Year/@size}" color="{../Year/@color}">
											<xsl:value-of select="../Year"/>
										</font>
									</xsl:if>
								</td>
								<td/>
							</tr>
						</table>
					</xsl:when>
					<xsl:when test="$CurDateFormat='mY' or $CurDateFormat='MY' or $CurFormat='my'">	
						<table cellpadding="0" cellspacing="0" border="0">
							<tr>
								<td/>
								<td>
									<xsl:if test="../Month/@quadrant='top'">
										<font face="{../Month/@face}" size="{../Month/@size}" color="{../Month/@color}">
											<xsl:value-of select="../Month"/>
										</font>
									</xsl:if>
								</td>
								<td/>
								<td/>
								<td>
									<xsl:if test="../Year/@quadrant='top'">
										<font face="{../Year/@face}" size="{../Year/@size}" color="{../Year/@color}">
											<xsl:value-of select="../Year"/>
										</font>
									</xsl:if>
								</td>
								<td/>
							</tr>
							<tr>
								<td>
									<xsl:if test="../Month/@quadrant='left'">
										<font face="{../Month/@face}" size="{../Month/@size}" color="{../Month/@color}">
											<xsl:value-of select="../Month"/>
										</font>
									</xsl:if>
								</td>
								<td>
									<xsl:call-template name="Textbox_Month">
										<xsl:with-param name="attrId" select="$attrId"/>
										<xsl:with-param name="inputNameMonth" select="$CurrentAttributeXPath[@id=$attrId]/InputFields/Input[@dataType='M']/@name"/>
										<xsl:with-param name="month" select="$month"/>
										<xsl:with-param name="VCSID" select="$VCSID"/>
										<xsl:with-param name="mvs" select="$SelectedAttributeXPath[@id=$attrId]/@mvs"/>
									</xsl:call-template>
								</td>
								<td>
									<xsl:if test="../Month/@quadrant='right'">
										<font face="{../Month/@face}" size="{../Month/@size}" color="{../Month/@color}">
											<xsl:value-of select="../Month"/>
										</font>
									</xsl:if>
								</td>
								<td>
									<xsl:if test="../Year/@quadrant='left'">
										<font face="{../Year/@face}" size="{../Year/@size}" color="{../Year/@color}">
											<xsl:value-of select="../Year"/>
										</font>
									</xsl:if>
								</td>
								<td>
									<xsl:call-template name="Textbox_Year">
										<xsl:with-param name="attrId" select="$attrId"/>
										<xsl:with-param name="inputNameYear" select="$CurrentAttributeXPath[@id=$attrId]/InputFields/Input[@dataType='Y']/@name"/>
										<xsl:with-param name="year" select="$year"/>
										<xsl:with-param name="VCSID" select="$VCSID"/>
										<xsl:with-param name="mvs" select="$SelectedAttributeXPath[@id=$attrId]/@mvs"/>
									</xsl:call-template>
								</td>
								<td>
									<xsl:if test="../Year/@quadrant='right'">
										<font face="{../Year/@face}" size="{../Year/@size}" color="{../Year/@color}">
											<xsl:value-of select="../Year"/>
										</font>
									</xsl:if>
								</td>
							</tr>
							<tr>
								<td/>
								<td>
									<xsl:if test="../Month/@quadrant='bottom'">
										<font face="{../Month/@face}" size="{../Month/@size}" color="{../Month/@color}">
											<xsl:value-of select="../Month"/>
										</font>
									</xsl:if>
								</td>
								<td/>
								<td/>
								<td>
									<xsl:if test="../Year/@quadrant='bottom'">
										<font face="{../Year/@face}" size="{../Year/@size}" color="{../Year/@color}">
											<xsl:value-of select="../Year"/>
										</font>
									</xsl:if>
								</td>
								<td/>
							</tr>
						</table>
					</xsl:when>
					<xsl:when test="$CurDateFormat='Ym' or $CurDateFormat='YM' or $CurFormat='ym'">	
						<table cellpadding="0" cellspacing="0" border="0">
							<tr>
								<td/>
								<td>
									<xsl:if test="../Year/@quadrant='top'">
										<font face="{../Year/@face}" size="{../Year/@size}" color="{../Year/@color}">
											<xsl:value-of select="../Year"/>
										</font>
									</xsl:if>
								</td>
								<td/>
								<td/>
								<td>
									<xsl:if test="../Month/@quadrant='top'">
										<font face="{../Month/@face}" size="{../Month/@size}" color="{../Month/@color}">
											<xsl:value-of select="../Month"/>
										</font>
									</xsl:if>
								</td>
								<td/>
							</tr>
							<tr>
								<td>
									<xsl:if test="../Year/@quadrant='left'">
										<font face="{../Year/@face}" size="{../Year/@size}" color="{../Year/@color}">
											<xsl:value-of select="../Year"/>
										</font>
									</xsl:if>
								</td>
								<td>
									<xsl:call-template name="Textbox_Year">
										<xsl:with-param name="attrId" select="$attrId"/>
										<xsl:with-param name="inputNameYear" select="$CurrentAttributeXPath[@id=$attrId]/InputFields/Input[@dataType='Y']/@name"/>
										<xsl:with-param name="year" select="$year"/>
										<xsl:with-param name="VCSID" select="$VCSID"/>
										<xsl:with-param name="mvs" select="$SelectedAttributeXPath[@id=$attrId]/@mvs"/>
									</xsl:call-template>
								</td>
								<td>
									<xsl:if test="../Year/@quadrant='right'">
										<font face="{../Year/@face}" size="{../Year/@size}" color="{../Year/@color}">
											<xsl:value-of select="../Year"/>
										</font>
									</xsl:if>
								</td>
								<td>
									<xsl:if test="../Month/@quadrant='left'">
										<font face="{../Month/@face}" size="{../Month/@size}" color="{../Month/@color}">
											<xsl:value-of select="../Month"/>
										</font>
									</xsl:if>
								</td>
								<td>
									<xsl:call-template name="Textbox_Month">
										<xsl:with-param name="attrId" select="$attrId"/>
										<xsl:with-param name="inputNameMonth" select="$CurrentAttributeXPath[@id=$attrId]/InputFields/Input[@dataType='M']/@name"/>
										<xsl:with-param name="month" select="$month"/>
										<xsl:with-param name="VCSID" select="$VCSID"/>
										<xsl:with-param name="mvs" select="$SelectedAttributeXPath[@id=$attrId]/@mvs"/>
									</xsl:call-template>
								</td>
								<td>
									<xsl:if test="../Month/@quadrant='right'">
										<font face="{../Month/@face}" size="{../Month/@size}" color="{../Month/@color}">
											<xsl:value-of select="../Month"/>
										</font>
									</xsl:if>
								</td>
							</tr>
							<tr>
								<td/>
								<td>
									<xsl:if test="../Year/@quadrant='bottom'">
										<font face="{../Year/@face}" size="{../Year/@size}" color="{../Year/@color}">
											<xsl:value-of select="../Year"/>
										</font>
									</xsl:if>
								</td>
								<td/>
								<td/>
								<td>
									<xsl:if test="../Month/@quadrant='bottom'">
										<font face="{../Month/@face}" size="{../Month/@size}" color="{../Month/@color}">
											<xsl:value-of select="../Month"/>
										</font>
									</xsl:if>
								</td>
								<td/>
							</tr>
						</table>
					</xsl:when>
					<xsl:when test="$CurDateFormat='Y' or $CurFormat='y'">
						<table cellpadding="0" cellspacing="0" border="0">
							<tr>
								<td>
									<xsl:if test="../Year/@quadrant='top'">
										<font face="{../Year/@face}" size="{../Year/@size}" color="{../Year/@color}">
											<xsl:value-of select="../Year"/>
										</font>
									</xsl:if>
								</td>
							</tr>
							<tr>
								<td>
									<xsl:if test="../Year/@quadrant='left'">
										<font face="{../Year/@face}" size="{../Year/@size}" color="{../Year/@color}">
											<xsl:value-of select="../Year"/>
										</font>
									</xsl:if>
								</td>
								<td>
									<xsl:call-template name="Textbox_Year">
										<xsl:with-param name="attrId" select="$attrId"/>
										<xsl:with-param name="inputNameYear" select="$CurrentAttributeXPath[@id=$attrId]/InputFields/Input[@dataType='Y']/@name"/>
										<xsl:with-param name="year" select="$year"/>
										<xsl:with-param name="VCSID" select="$VCSID"/>
										<xsl:with-param name="mvs" select="$SelectedAttributeXPath[@id=$attrId]/@mvs"/>
									</xsl:call-template>
								</td>
								<td>
									<xsl:if test="../Year/@quadrant='right'">
										<font face="{../Year/@face}" size="{../Year/@size}" color="{../Year/@color}">
											<xsl:value-of select="../Year"/>
										</font>
									</xsl:if>
								</td>
							</tr>
							<tr>
								<td>
									<xsl:if test="../Year/@quadrant='bottom'">
										<font face="{../Year/@face}" size="{../Year/@size}" color="{../Year/@color}">
											<xsl:value-of select="../Year"/>
										</font>
									</xsl:if>
								</td>
							</tr>
						</table>
					</xsl:when>
					<xsl:when test="$CurDateFormat='c' or $CurFormat='c'">
						<table cellpadding="0" cellspacing="0" border="0">
							<tr>
								<td>
									<xsl:call-template name="Textbox_FullDate">
										<xsl:with-param name="attrId" select="$attrId"/>
										<xsl:with-param name="inputName" select="$inputName"/>
										<xsl:with-param name="day" select="$day"/>
										<xsl:with-param name="month" select="$month"/>
										<xsl:with-param name="year" select="$year"/>
										<xsl:with-param name="SelectedAttributeXPath" select="$SelectedAttributeXPath"/>
										<xsl:with-param name="VCSID" select="$VCSID"/>
									</xsl:call-template>
								</td>
							</tr>
						</table>
					</xsl:when>
				</xsl:choose>
			</xsl:when>
			<xsl:otherwise>
				<input type="text">
					<xsl:attribute name="maxlength"><xsl:choose><xsl:when test="@maxlength"><xsl:value-of select="@maxlength"/></xsl:when><xsl:otherwise>300</xsl:otherwise></xsl:choose></xsl:attribute>
					<xsl:attribute name="size"><xsl:choose><xsl:when test="@size"><xsl:value-of select="@size"/></xsl:when><xsl:otherwise>20</xsl:otherwise></xsl:choose></xsl:attribute>
					<xsl:choose>
						<xsl:when test="$thisPage='SYI'">
							<xsl:variable name="FieldName" select="concat('attr_t',$VCSID,'_',$attrId)"/>
							<xsl:variable name="InputValue">
								<xsl:choose>
									<xsl:when test="$UsePostedFormFields">
										<xsl:value-of select="$FormFields/FormField[@name = $FieldName]/Value"/>
									</xsl:when>
									<xsl:otherwise>
										<xsl:value-of select="$SelectedAttributeXPath[@id=$attrId]/Value/Name"/>				
									</xsl:otherwise>
								</xsl:choose>
							</xsl:variable>
							<xsl:choose>
								<xsl:when test="$SelectedAttributeXPath[@id=$attrId]/@mvs">
									<xsl:attribute name="name"><xsl:value-of select="$FieldName"/>_mvs</xsl:attribute>
									<xsl:attribute name="id"><xsl:value-of select="$FieldName"/></xsl:attribute>
									<xsl:attribute name="value"><xsl:value-of select="/eBay/GlobalSettings/MultipleValuesString"/></xsl:attribute>
									<xsl:attribute name="style">font: italic; color: gray;</xsl:attribute>
									<xsl:attribute name="onFocus">if(this.value=='<xsl:value-of select="/eBay/GlobalSettings/MultipleValuesString"/>'){this.value='';this.style.color='black';this.style.fontStyle='normal';this.name=this.name.substring(0,this.name.length-4);}</xsl:attribute>
									<xsl:attribute name="onBlur">if(this.value==''){this.value='<xsl:value-of select="/eBay/GlobalSettings/MultipleValuesString"/>';this.style.color='gray';this.style.fontStyle='italic';this.name=this.name+'_mvs'}</xsl:attribute>
								</xsl:when>
								<xsl:otherwise>
									<xsl:attribute name="name"><xsl:value-of select="$FieldName"/></xsl:attribute>
									<xsl:attribute name="value"><xsl:value-of select="$InputValue"/></xsl:attribute>
								</xsl:otherwise>
							</xsl:choose>
						</xsl:when>
						<xsl:otherwise>
							<xsl:attribute name="name"><xsl:value-of select="$inputName"/></xsl:attribute>
							<xsl:attribute name="class"><xsl:value-of select="$inputName"/></xsl:attribute>
							<xsl:attribute name="value"><xsl:value-of select="normalize-space($SelectedAttributeXPath[@id=$attrId]/InputFields/Input/Value)"/></xsl:attribute>
						</xsl:otherwise>
					</xsl:choose>
				</input>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template name="Textbox_Day">
		<xsl:param name="attrId"/>
		<xsl:param name="inputNameDay"/>
		<xsl:param name="day"/>
		<xsl:param name="VCSID"/>
		<xsl:param name="mvs" select="false()"/>
		<xsl:variable name="FieldNameD" select="concat('attr_d',$VCSID,'_',$attrId,'_d')"/>
		<xsl:variable name="InputValueD">
			<xsl:choose>
				<xsl:when test="$UsePostedFormFields">
					<xsl:value-of select="$FormFields/FormField[@name = $FieldNameD]/Value"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:if test="not($day='00')  and not($day='99')">
						<xsl:value-of select="$day"/>
					</xsl:if>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<input type="text" maxlength="2">
			<xsl:attribute name="size"><xsl:choose><xsl:when test="@size"><xsl:value-of select="@size"/></xsl:when><xsl:otherwise>2</xsl:otherwise></xsl:choose></xsl:attribute>
			<xsl:choose>
				<xsl:when test="$thisPage='SYI'">
					<xsl:choose>
						<xsl:when test="$mvs">
							<xsl:attribute name="name"><xsl:value-of select="$FieldNameD"/>_mvs</xsl:attribute>
							<xsl:attribute name="id"><xsl:value-of select="$FieldNameD"/></xsl:attribute>
							<xsl:attribute name="value"><xsl:value-of select="/eBay/GlobalSettings/MultipleValuesString"/></xsl:attribute>
							<xsl:attribute name="style">font: italic; color: gray;</xsl:attribute>
							<xsl:attribute name="onFocus">if(this.value=='<xsl:value-of select="/eBay/GlobalSettings/MultipleValuesString"/>'){this.value='';this.style.color='black';this.style.fontStyle='normal'}</xsl:attribute>
							<xsl:attribute name="onBlur">if(this.value==''){this.value='<xsl:value-of select="/eBay/GlobalSettings/MultipleValuesString"/>';this.style.color='gray';this.style.fontStyle='italic';this.name=this.name.substring(0,this.name.length-4);}</xsl:attribute>
						</xsl:when>
						<xsl:otherwise>
							<xsl:attribute name="name"><xsl:value-of select="$FieldNameD"/></xsl:attribute>
							<xsl:attribute name="value"><xsl:value-of select="$InputValueD"/></xsl:attribute>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<xsl:otherwise>
					<xsl:attribute name="class"><xsl:value-of select="$inputNameDay"/></xsl:attribute>
					<xsl:attribute name="name"><xsl:value-of select="$inputNameDay"/></xsl:attribute>
					<xsl:attribute name="value"><xsl:value-of select="$InputValueD"/></xsl:attribute>
				</xsl:otherwise>
			</xsl:choose>
		</input>
	</xsl:template>
	<xsl:template name="Textbox_Month">
		<xsl:param name="attrId"/>
		<xsl:param name="inputNameMonth"/>
		<xsl:param name="month"/>
		<xsl:param name="VCSID"/>
		<xsl:param name="mvs" select="false()"/>
		<xsl:variable name="FieldNameM" select="concat('attr_d',$VCSID,'_',$attrId,'_m')"/>
		<xsl:variable name="InputValueM">
			<xsl:choose>
				<xsl:when test="$UsePostedFormFields">
					<xsl:value-of select="$FormFields/FormField[@name = $FieldNameM]/Value"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:if test="not($month='00')  and not($month='99')">
						<xsl:value-of select="$month"/>
					</xsl:if>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<input type="text" maxlength="2">
			<xsl:attribute name="size"><xsl:choose><xsl:when test="@size"><xsl:value-of select="@size"/></xsl:when><xsl:otherwise>2</xsl:otherwise></xsl:choose></xsl:attribute>
			<xsl:choose>
				<xsl:when test="$thisPage='SYI'">
					<xsl:choose>
						<xsl:when test="$mvs">
							<xsl:attribute name="name"><xsl:value-of select="$FieldNameM"/>_mvs</xsl:attribute>
							<xsl:attribute name="id"><xsl:value-of select="$FieldNameM"/></xsl:attribute>
							<xsl:attribute name="value"><xsl:value-of select="/eBay/GlobalSettings/MultipleValuesString"/></xsl:attribute>
							<xsl:attribute name="style">font: italic; color: gray;</xsl:attribute>
							<xsl:attribute name="onFocus">if(this.value=='<xsl:value-of select="/eBay/GlobalSettings/MultipleValuesString"/>'){this.value='';this.style.color='black';this.style.fontStyle='normal'}</xsl:attribute>
							<xsl:attribute name="onBlur">if(this.value==''){this.value='<xsl:value-of select="/eBay/GlobalSettings/MultipleValuesString"/>';this.style.color='gray';this.style.fontStyle='italic';this.name=this.name.substring(0,this.name.length-4);}</xsl:attribute>
						</xsl:when>
						<xsl:otherwise>
							<xsl:attribute name="name"><xsl:value-of select="$FieldNameM"/></xsl:attribute>
							<xsl:attribute name="value"><xsl:value-of select="$InputValueM"/></xsl:attribute>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<xsl:otherwise>
					<xsl:attribute name="class"><xsl:value-of select="$inputNameMonth"/></xsl:attribute>
					<xsl:attribute name="name"><xsl:value-of select="$inputNameMonth"/></xsl:attribute>
					<xsl:attribute name="value"><xsl:value-of select="$InputValueM"/></xsl:attribute>
				</xsl:otherwise>
			</xsl:choose>
		</input>
	</xsl:template>
	<xsl:template name="Textbox_Year">
		<xsl:param name="attrId"/>
		<xsl:param name="inputNameYear"/>
		<xsl:param name="year"/>
		<xsl:param name="VCSID"/>
		<xsl:param name="mvs" select="false()"/>
		<xsl:variable name="FieldNameY" select="concat('attr_d',$VCSID,'_',$attrId,'_y')"/>
		<xsl:variable name="InputValueY">
			<xsl:choose>
				<xsl:when test="$UsePostedFormFields">
					<xsl:value-of select="$FormFields/FormField[@name = $FieldNameY]/Value"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:if test="not($year='0000') and not($year='____') and not($year='9999')">
						<xsl:value-of select="$year"/>
					</xsl:if>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<input type="text" maxlength="4">
			<xsl:attribute name="size"><xsl:choose><xsl:when test="@size"><xsl:value-of select="@size"/></xsl:when><xsl:otherwise>5</xsl:otherwise></xsl:choose></xsl:attribute>
			<xsl:choose>
				<xsl:when test="$thisPage='SYI'">
					<xsl:choose>
						<xsl:when test="$mvs">
							<xsl:attribute name="name"><xsl:value-of select="$FieldNameY"/>_mvs</xsl:attribute>
							<xsl:attribute name="id"><xsl:value-of select="$FieldNameY"/></xsl:attribute>
							<xsl:attribute name="value"><xsl:value-of select="/eBay/GlobalSettings/MultipleValuesString"/></xsl:attribute>
							<xsl:attribute name="style">font: italic; color: gray;</xsl:attribute>
							<xsl:attribute name="onFocus">if(this.value=='<xsl:value-of select="/eBay/GlobalSettings/MultipleValuesString"/>'){this.value='';this.style.color='black';this.style.fontStyle='normal'}</xsl:attribute>
							<xsl:attribute name="onBlur">if(this.value==''){this.value='<xsl:value-of select="/eBay/GlobalSettings/MultipleValuesString"/>';this.style.color='gray';this.style.fontStyle='italic';;this.name=this.name.substring(0,this.name.length-4);}</xsl:attribute>
						</xsl:when>
						<xsl:otherwise>
							<xsl:attribute name="name"><xsl:value-of select="$FieldNameY"/></xsl:attribute>
							<xsl:attribute name="value"><xsl:value-of select="$InputValueY"/></xsl:attribute>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<xsl:otherwise>
					<xsl:attribute name="class"><xsl:value-of select="$inputNameYear"/></xsl:attribute>
					<xsl:attribute name="name"><xsl:value-of select="$inputNameYear"/></xsl:attribute>
					<xsl:attribute name="value"><xsl:value-of select="$InputValueY"/></xsl:attribute>
				</xsl:otherwise>
			</xsl:choose>
		</input>
	</xsl:template>
	<xsl:template name="Textbox_FullDate">
		<xsl:param name="attrId"/>
		<xsl:param name="inputName"/>
		<xsl:param name="day"/>
		<xsl:param name="month"/>
		<xsl:param name="year"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="VCSID"/>
		<xsl:variable name="FieldName" select="concat('attr_d',$VCSID,'_',$attrId,'_c')"/>
		<xsl:variable name="InputValue">
			<xsl:choose>
				<xsl:when test="$UsePostedFormFields">
					<xsl:value-of select="$FormFields/FormField[@name = $FieldName]/Value"/>
				</xsl:when>
				<xsl:when test="$SelectedAttributeXPath[@id=$attrId]/Value[Year or Month or Day]">
					<xsl:choose>
						<xsl:when test="@isEuro='y'">
							<xsl:if test="not($day='00')  and not($day='99')">
								<xsl:value-of select="$day"/>/</xsl:if>
							<xsl:if test="not($month='00')  and not($month='99')">
								<xsl:value-of select="$month"/>/</xsl:if>
							<xsl:if test="not($year='0000') and not($year='____')  and not($year='9999')">
								<xsl:value-of select="$year"/>
							</xsl:if>
						</xsl:when>
						<xsl:otherwise>
							<xsl:if test="not($month='00')  and not($month='99')">
								<xsl:value-of select="$month"/>/</xsl:if>
							<xsl:if test="not($day='00')  and not($day='99')">
								<xsl:value-of select="$day"/>/</xsl:if>
							<xsl:if test="not($year='0000') and not($year='____')  and not($year='9999')">
								<xsl:value-of select="$year"/>
							</xsl:if>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of disable-output-escaping="no" select="$SelectedAttributeXPath[@id=$attrId]/Value/Name"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<input type="text" maxlength="10">
			<xsl:attribute name="size"><xsl:choose><xsl:when test="@size"><xsl:value-of select="@size"/></xsl:when><xsl:otherwise>20</xsl:otherwise></xsl:choose></xsl:attribute>
			<xsl:choose>
				<xsl:when test="$thisPage='SYI'">
					<xsl:choose>
						<xsl:when test="$SelectedAttributeXPath[@id=$attrId]/@mvs">
							<xsl:attribute name="name"><xsl:value-of select="$FieldName"/>_mvs</xsl:attribute>
							<xsl:attribute name="id"><xsl:value-of select="$FieldName"/></xsl:attribute>
							<xsl:attribute name="value"><xsl:value-of select="/eBay/GlobalSettings/MultipleValuesString"/></xsl:attribute>
							<xsl:attribute name="style">font: italic; color: gray;</xsl:attribute>
							<xsl:attribute name="onFocus">if(this.value=='<xsl:value-of select="/eBay/GlobalSettings/MultipleValuesString"/>'){this.value='';this.style.color='black';this.style.fontStyle='normal'}</xsl:attribute>
							<xsl:attribute name="onBlur">if(this.value==''){this.value='<xsl:value-of select="/eBay/GlobalSettings/MultipleValuesString"/>';this.style.color='gray';this.style.fontStyle='italic';this.name=this.name.substring(0,this.name.length-4);}</xsl:attribute>
						</xsl:when>
						<xsl:otherwise>
							<xsl:attribute name="name"><xsl:value-of select="$FieldName"/></xsl:attribute>
							<xsl:attribute name="value"><xsl:value-of select="$InputValue"/></xsl:attribute>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<xsl:otherwise>
					<xsl:attribute name="class"><xsl:value-of select="$inputName"/></xsl:attribute>
					<xsl:attribute name="name"><xsl:value-of select="$inputName"/></xsl:attribute>
					<xsl:attribute name="value"><xsl:value-of select="$InputValue"/></xsl:attribute>
				</xsl:otherwise>
			</xsl:choose>
		</input>
	</xsl:template>

	<xsl:output method="html" encoding="UTF-8"/>
	<xsl:variable name="API.Overrides" select="/eBay/API.XSL.Overrides"/>
	<xsl:variable name="selectedSets" select="$RootNode/SelectedAttributes/AttributeSet"/> 
	<xsl:variable name="IsConditional" select="true()"/>  <!-- we will need to check for this in the SYI.Webflow to determine if they are in the conditional flow -->
	<xsl:variable name="FormFields" select="/eBay/PostedFormFields"/>
	<xsl:variable name="PageErrors" select="boolean(/eBay/Errors)"/>
	<xsl:variable name="UsePostedFormFields" select="''"/>
	<xsl:variable name="CharacteristicsSets" select="$RootNode/Characteristics/CharacteristicsSet[@id = $selectedSets/@id]"/>
	<xsl:variable name="attrList" select="$CharacteristicsSets/CharacteristicsList/*"/>
	<xsl:variable name="attrData" select="$CharacteristicsSets/CharacteristicsList/*/Attribute"/>
	<xsl:variable name="thisPI" select="$CharacteristicsSets/PresentationInstruction/*/*/*/Attribute"/>
	<xsl:variable name="thisPage" select="'SYI'"/>
	<xsl:variable name="subPage" select="'API'"/>
	<xsl:variable name="returnAttr" select="$selectedSets/Attribute"/> <!-- $RootNode/SelectedAttributes/Attribute -->
	<xsl:variable name="categories" select="$RootNode/Attributes/AttributeSet | $RootNode/Attributes/CategoryMappingDetails/CategoryMapping/AttributeSet"/>
	<xsl:variable name="formName">
		<xsl:choose>
			<xsl:when test="$API.Overrides/Use/Form/@name != '' "><xsl:value-of select="$API.Overrides/Use/Form/@name"/></xsl:when>
			<xsl:otherwise>APIForm</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>

	<xsl:variable name="fonts" select="$API.Overrides/Styles/Fonts/font"/>
	<xsl:variable name="attrAsterisk">
		<img src="http://pics.ebay.com/aw/pics/asteriskG_10x10.gif" width="10" height="10">
			<xsl:copy-of select="$API.Overrides/Styles/Images/Image.RequiredMark/@*"/>
		</img>
	</xsl:variable>
	<xsl:variable name="Image.ArrowMaroon">
		<img height="11" src="http://pics.ebay.com/aw/pics/arrowMaroon_9x11.gif" width="9">
			<xsl:copy-of select="$API.Overrides/Styles/Images/Image.ArrowMaroon/@*"/>
		</img>
	</xsl:variable>
	<xsl:template name="ItemSpecifics">
		<xsl:choose>
			<xsl:when test="$CharacteristicsSets/CharacteristicsList/*/Attribute[Dependency or ValueList/Value/@id = '-6' or Dependency/Value/@id = '-6' ]">
				<script LANGUAGE="JavaScript1.1">
					<xsl:comment>
						<xsl:call-template name="JS_Arrays"/>
					//</xsl:comment>	
				</script>
				<xsl:call-template name="JS_Arrays_Other">
					<xsl:with-param name="CurrentAttributeXPath" select="$CharacteristicsSets/CharacteristicsList/*/Attribute"/>
					<xsl:with-param name="SelectedAttributeXPath" select="$selectedSets/Attribute"/>
				</xsl:call-template>
				<xsl:call-template name="JS"/>
			</xsl:when>
			<xsl:otherwise>
				<script LANGUAGE="JavaScript1.1">
					<xsl:comment>
						function api_check_on_other(attributeId, attributeValue) {}
					//</xsl:comment>	
				</script>
			</xsl:otherwise>
		</xsl:choose>
		<xsl:call-template name="Categories"/>
		<!-- Turbo Lister is currently using it -->
		<xsl:if test="/eBay/API.XSL.Overrides/ClientSettings/@client='TL' ">
			<xsl:call-template name="GenerateAllAsHiddenFields"/>
		</xsl:if>
		<xsl:call-template name="Attributes"/>
		<xsl:if test="$CharacteristicsSets/CharacteristicsList/*/*/Dependency[@type='1' or @type='2']">
			<noscript>
				<table border="0" cellpadding="4" cellspacing="0" width="95%" align="left">
					<tr>
						<td>
							<img src="http://pics.ebay.com/aw/pics/homepage/spacer.gif" width="1" height="13" border="0">
								<xsl:copy-of select="$API.Overrides/Styles/Images/Image.Spacer/@*"/>
							</img>
						</td>
					</tr>
					<tr>
						<td nowrap="nowrap" colspan="2" bgcolor="#efefef" valign="bottom">
							<img src="http://pics.ebay.com/aw/pics/arrowMaroon_9x11.gif" width="9" height="11"/>
							<font face="Arial, Helvetica, sans-serif" size="2" color="660000">
								<xsl:copy-of select="$fonts[@id='non-js-update-section']/@*"/>
								<b>Your browser does not allow automatic updating of this section.</b>
							</font>
						</td>
					</tr>
					<tr>
						<td bgcolor="#efefef">
							<input type="submit" name="refreshdependencies" value="Update"/>
						</td>
						<td bgcolor="#efefef">
							<font face="Arial, Helvetica, sans-serif" size="2">
								<xsl:copy-of select="$fonts[@id='non-js-update-section']/@*"/>
								Please click <b>Update </b>to see relevant choices in noted Item Specifics above.
							</font>
						</td>
					</tr>
				</table>
			</noscript>
			<xsl:call-template name="InitializeCascades">
				<xsl:with-param name="SelectedAttributes" select="$selectedSets"/>
				<xsl:with-param name="CurrentAttributes" select="$CharacteristicsSets/CharacteristicsList/*/Attribute"/>
			</xsl:call-template>
		</xsl:if>
		<input type="hidden" name="aus_form_changed" value="default"/>
		<input type="hidden" name="ButtonLoad" value="default"/>
		<xsl:call-template name="RefreshDependencyOnLoad"/>
	</xsl:template>
	
	<xsl:template name="GenerateAllAsHiddenFields">
		<xsl:variable name="HtmlSource">
			<xsl:call-template name="Attributes">
				<xsl:with-param name="showDefault" select="true()"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:choose>
			<xsl:when test="function-available('xal:nodeset')">
				<xsl:apply-templates mode="fieldsOnly" select="xal:nodeset($HtmlSource)"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:apply-templates mode="fieldsOnly" select="x:node-set($HtmlSource)"/>
			</xsl:otherwise>
		</xsl:choose>
		<xsl:fallback>
		</xsl:fallback>
	</xsl:template>
	<xsl:template name="RefreshDependencyOnLoad">
		<xsl:variable name="HtmlSource">
			<xsl:call-template name="Attributes">
				<xsl:with-param name="showDefault" select="true()"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:choose>
			<xsl:when test="function-available('xal:nodeset')">
				<xsl:variable name="HtmlSorceNode" select="xal:nodeset($HtmlSource)"/>
				<xsl:apply-templates mode="refreshDependency" select="$HtmlSorceNode"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:variable name="HtmlSorceNode" select="x:node-set($HtmlSource)"/>
				<xsl:apply-templates mode="refreshDependency" select="$HtmlSorceNode"/>
			</xsl:otherwise>
		</xsl:choose>
		<xsl:fallback>
		</xsl:fallback>
	</xsl:template>
	<xsl:template mode="refreshDependency" match="node() | @*">
		<xsl:apply-templates mode="refreshDependency" select="node() | @*"/>
	</xsl:template>
	<xsl:template mode="refreshDependency" match="input | Input | INPUT | select | Select | SELECT">
		<xsl:if test="contains(@onChange, 'vvpPost')">
			<script LANGUAGE="JavaScript1.1">
				<xsl:value-of select="concat(substring-before(substring-after(@onChange, vvpPost), ')'), ',1)')"/>;
			</script>
		</xsl:if>
		<xsl:if test="contains(@onClick, 'vvc_anyParent')">
			<script LANGUAGE="JavaScript1.1">
				<xsl:value-of select="concat(substring-before(substring-after(@onClick, vvc_anyParent), ')'), ')')"/>;
			</script>
		</xsl:if>
		<xsl:if test="contains(@onChange, 'aus_set_parent')">
			<script LANGUAGE="JavaScript1.1">
			<xsl:value-of select="concat(substring-before(substring-after(@onChange, aus_set_parent), ')'), ',1)')"/>;
			</script>
		</xsl:if>
	</xsl:template>
	<xsl:template mode="fieldsOnly" match="node() | @*">
		<xsl:apply-templates mode="fieldsOnly" select="node() | @*"/>
	</xsl:template>
	<xsl:template mode="fieldsOnly" match="input | Input | INPUT | select | Select | SELECT">
		<xsl:if test="@checked or not(@type) or @type!='radio' and @type!='checkbox'">
			<xsl:element name="input">
				<xsl:attribute name="type">hidden</xsl:attribute>
				<xsl:attribute name="name">def_<xsl:value-of select="@name"/></xsl:attribute>
				<xsl:attribute name="value"><xsl:value-of select="@value | option[@selected]/@value | option[1]/@value"/></xsl:attribute>
			</xsl:element>
		</xsl:if>
	</xsl:template>
	<xsl:template name="InitializeCascades">
		<xsl:param name="SelectedAttributes"/>
		<xsl:param name="CurrentAttributes"/>
		<script LANGUAGE="JavaScript1.1">
			createButtonLoad();
			<xsl:if test="$CurrentAttributes/Dependency[@type='1' or @type='2']">
				<xsl:for-each select="$CurrentAttributes">
					<xsl:if test="*[@type='1' or @type='2']">
						<xsl:variable name="attributeId" select="@id"/>
						<xsl:variable name="attributeValue" select="$SelectedAttributes/Attribute[@id=$attributeId]/Value"/>
						<xsl:choose>
							<xsl:when test="$attributeValue[@id='-100' or @id='-10']">
								aus_init_cascades("attr<xsl:value-of select="concat(../../../@id, '_',$attributeId)"/>",1);
							</xsl:when>
							<xsl:when test="not(Dependency[@parentValueId = $attributeValue/@id])">
								aus_init_cascades("attr<xsl:value-of select="concat(../../../@id, '_',$attributeId)"/>",1);
							</xsl:when>
							<xsl:when test="$attributeValue[@id='-6'] and Dependency[@parentValueId=$attributeValue/@id]/Value[@id='-10']">
								aus_init_cascades("attr<xsl:value-of select="concat(../../../@id, '_',$attributeId)"/>",1);
							</xsl:when>
							<xsl:when test="$attributeValue or $UsePostedFormFields"/>
							<xsl:otherwise>
								aus_init_cascades("attr<xsl:value-of select="concat(../../../@id, '_',$attributeId)"/>",1);
							</xsl:otherwise>
						</xsl:choose>
					</xsl:if>
				</xsl:for-each>
			</xsl:if>
		</script>
	</xsl:template>
	<xsl:template name="Categories">
		<xsl:choose>
			<xsl:when test="$selectedSets/@id=$categories/@id">
			</xsl:when>
			<xsl:otherwise>
				Select category:
				<br/>
				<select name="vcsid">
					<xsl:attribute name="onchange">javascript: document.forms['<xsl:value-of select="$formName"/>'].submit();</xsl:attribute>
					<option value="-10">
						<xsl:if test="$categories/@id != $selectedSets/@id">
							<xsl:attribute name="selected"><xsl:value-of select="'selected'"/></xsl:attribute>
						</xsl:if>
						<xsl:text>--</xsl:text>
					</option>
					<xsl:for-each select="$categories">
						<option value="{@id}">
							<xsl:if test="@id = $selectedSets/@id">
								<xsl:attribute name="selected"><xsl:value-of select="'selected'"/></xsl:attribute>
							</xsl:if>
							<xsl:value-of select="DomainName"/>
						</option>
					</xsl:for-each>
				</select>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template name="PromoMessage">
		<xsl:param name="Message"/>
		<xsl:if test="$Message != ''">
			<table border="0" cellpadding="0" cellspacing="0">
				<tr><td>&#160;</td></tr>
				<tr><td>
					<font>
						<xsl:copy-of select="$fonts[@id='default']/@*"/>
						<xsl:value-of disable-output-escaping="yes" select="$Message"/>
					</font>
				</td></tr>
				<tr><td>&#160;</td></tr>
			</table>
		</xsl:if>
	</xsl:template>
	<xsl:template name="TableSpacerCell">
		<xsl:param name="width" select="'1' "/>
		<xsl:param name="height" select="'1' "/>
		<xsl:param name="colspan" select="'1' "/>
		<xsl:param name="rowspan" select=" '1' "/>
		<xsl:param name="bgcolor" select="''"/>
		<td width="{$width}" colspan="{$colspan}" rowspan="{$rowspan}">
			<xsl:if test="$bgcolor != ''">
				<xsl:attribute name="bgcolor"><xsl:value-of select="$bgcolor"/></xsl:attribute>
			</xsl:if>
			<img src="http://pics.ebay.com/aw/pics/spacer.gif" alt="" border="0" width="{$width}" height="{$height}">
				<xsl:copy-of select="$API.Overrides/Styles/Images/Image.Spacer/@*"/>
			</img>
		</td>
	</xsl:template>
	<xsl:template mode="API.Other" match="Attribute">
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:variable name="attrId" select="@id"/>
		<xsl:variable name="VCSID" select="../../../@id"/>
				<input type="text" name="attr_t{$VCSID}_{$attrId}" value="{$selectedSets[@id = $VCSID]/Attribute[@id = $attrId]/Value[not(@id) or @id = '-6']/Name[. != '']}"/>
	</xsl:template>
	<xsl:template mode="IsOtherSelected" match="Input">
		<xsl:param name="attrId"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:variable name="VCSID" select="../../../../../../@id"/>
		<xsl:if test="$thisPage='SYI' and ../../@type!='date'" >
			<xsl:variable name="parentAttrId" select="$CurrentAttributeXPath[Dependency/@childAttrId=$attrId]/@id"/>
			<xsl:variable name="selectedValueId" select="$selectedSets[@id = $VCSID]/Attribute[@id=$attrId]/Value/@id"/>
			<xsl:choose>
				<xsl:when test="$selectedValueId = '-6'"><xsl:value-of select="'selected'"/></xsl:when>
				<xsl:when test="$parentAttrId">
					<xsl:choose>
						<xsl:when test="$CurrentAttributeXPath[@id=$parentAttrId]/*[@isVisible='true']">
							<xsl:apply-templates mode="IsOtherSelected" select="$CurrentAttributeXPath[@id=$parentAttrId]/Dependency[(@type='1' or @type='2' or @type='3') and @childAttrId=$attrId and @isVisible='true' ]/Value[not($selectedValueId) or @id = $selectedValueId][1]"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:variable name="SelectedParentValueId" select="$SelectedAttributeXPath[@id=$parentAttrId]/Value/@id"/>
							<xsl:variable name="syiParentValueId" select="$SelectedParentValueId | $CurrentAttributeXPath[not($SelectedParentValueId) and @id=$parentAttrId]/ValueList/Value[1]/@id"/>
							<xsl:choose>
								<xsl:when test="$subPage='API' and $CurrentAttributeXPath[@id=$parentAttrId]/Dependency[(@type='3' or @type='4' or @type='5') and @parentValueId=$syiParentValueId and @childAttrId=$attrId]">
									<xsl:apply-templates mode="IsOtherSelected" select="$CurrentAttributeXPath[@id=$parentAttrId]/Dependency[@parentValueId=$syiParentValueId and @childAttrId=$attrId]/Value[count(. | key('attrByIDs', concat($VCSID, '_', key('selectedAttrByIDs', concat($VCSID, '_', $parentAttrId, '_', $syiParentValueId))/@id, '_', @id))[1])=1][1]">
										<xsl:sort select="@id"/>
									</xsl:apply-templates>
								</xsl:when>
								<xsl:when test="$syiParentValueId and $CurrentAttributeXPath[@id=$parentAttrId]/Dependency[@type='1' or @type='2']">
									<xsl:apply-templates mode="IsOtherSelected" select="$CurrentAttributeXPath[@id=$parentAttrId]/Dependency[@parentValueId=$syiParentValueId]/Value[not($selectedValueId) or @id = $selectedValueId][1]"/>
								</xsl:when>
							</xsl:choose>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<xsl:when test="$CurrentAttributeXPath[@id = $attrId][EditType = 1 or EditType = 2] and $SelectedAttributeXPath[@id = $attrId][@source = 1 or @source=3]"></xsl:when>
				<xsl:when test="not($selectedValueId)"> <!-- works as otherwise but with condition that no values has been selected for this attributes -->
					<xsl:apply-templates mode="IsOtherSelected" select="$CurrentAttributeXPath[@id=$attrId]/ValueList/Value[1]"/>
				</xsl:when>
			</xsl:choose>
		</xsl:if>
	</xsl:template>
	<xsl:template mode="IsOtherSelected" match="Value">
		<xsl:if test="@id = '-6'"><xsl:value-of select="'selected'"/></xsl:if>
	</xsl:template>
	<xsl:template name="JS_Arrays_Other">
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:param name="SelectedAttributeXPath"/>
			<script LANGUAGE="JavaScript1.1">
				<xsl:comment>

					others_selected = {
						<xsl:variable name="InitiallySetAttributes" select="$selectedSets/Attribute[Value/@id = -6]"/>
						<xsl:variable name="DefaultSetAttributes" select="$CurrentAttributeXPath[ValueList/Value[1]/@id = -6]"/>
						<xsl:for-each select="$InitiallySetAttributes">"attr<xsl:value-of select="../@id"/>_<xsl:value-of select="@id"/>" : "-6"<xsl:if test="not(position() = last()) or $DefaultSetAttributes">,</xsl:if></xsl:for-each>
						<xsl:for-each select="$DefaultSetAttributes">"attr<xsl:value-of select="../../../@id"/>_<xsl:value-of select="@id"/>" : "-6"<xsl:if test="not(position() = last())">,</xsl:if></xsl:for-each>
					}
				//</xsl:comment>
			</script>
	</xsl:template>
	<xsl:template name="AttributeError">
		<xsl:param name="InputId"/>
		<xsl:param name="VCSID"/>
		<xsl:param name="Col" select="'1'"/>
		<xsl:variable name="Error" select="/eBay/Errors/ErrorSet[@id = $VCSID]/Error[@id = $InputId]"/>
		<xsl:if test="boolean($Error)">
			<tr>
				<td colspan="{$Col}">
					<span class="Error">
						<font  face="Arial, Helvetica, sans-serif" size="2" color="#CC0000">
							<xsl:copy-of select="$fonts[@id='Error']/@*"/> <!-- setting up the font and its style if provided -->
							<xsl:value-of select="$Error"/>
						</font>
					</span>
				</td>
			</tr>
		</xsl:if>
	</xsl:template>
	<xsl:template mode="API" match="Value">
		<xsl:param name="attrId"/>
		<xsl:param name="PI.Attribute"/>
		<xsl:param name="CurrentAttributeXPath"/>
		<xsl:variable name="Months">
			<xsl:choose>
				<xsl:when test="/eBay/GlobalSettings/MonthAscendingLong"><xsl:value-of select="/eBay/GlobalSettings/MonthAscendingLong"/></xsl:when>
				<xsl:otherwise>January;February;March;April;May;June;July;August;September;October;November;December;</xsl:otherwise><!-- if no localized version provided then use English -->
			</xsl:choose>
		</xsl:variable>
		<xsl:choose>
			<xsl:when test="starts-with($PI.Attribute/Input/@format, 'm') or starts-with($PI.Attribute/Input/@format, 'M')">
				<!-- format: MMMM DD, YYYY -->
				<xsl:if test="not(Month='00' or Month='99')">
					<xsl:call-template name="GetStringToken">
						<xsl:with-param name="String" select="$Months"/>
						<xsl:with-param name="Separator" select=" ';' "/>
						<xsl:with-param name="Index" select="number(Month)"/>
					</xsl:call-template>
				</xsl:if>
				<xsl:if test="Day[.!='00'] and Day[.!='99']">	&#160;<xsl:value-of select="Day"/><xsl:if test="Year[.!='0000'] and Year[.!='9999']">,&#160;</xsl:if></xsl:if>
				<xsl:if test="Year[.!='0000'] and Year[.!='9999']"><xsl:value-of select="Year"/></xsl:if>
			</xsl:when>
			<xsl:otherwise>
				<!-- format DD.MM.YYYY -->
				<xsl:if test="Day and Day[.!='00'] and Day[.!='99']">
					<xsl:value-of select="Day"/><xsl:if test="Month and Month[.!='00'] and Month[.!='99']">.</xsl:if>
				</xsl:if>
				<xsl:if test="not(Month='00' or Month='99')">
					<xsl:call-template name="GetStringToken">
						<xsl:with-param name="String" select="$Months"/>
						<xsl:with-param name="Separator" select=" ';' "/>
						<xsl:with-param name="Index" select="number(Month)"/>
					</xsl:call-template>
				</xsl:if>
				<xsl:if test="Year[.!='0000'] and Year[.!='9999']">
					<xsl:if test="(Day and Day[.!='00'] and Day[.!='99'])  or (Month and Month[.!='00'] and Month[.!='99'])">.</xsl:if><xsl:value-of select="Year"/>
				</xsl:if>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template name="GetStringToken">
		<xsl:param name="String"/>
		<xsl:param name="Separator"/>
		<xsl:param name="Index"/>
		<xsl:choose>
			<xsl:when test="$Index &gt; 1">
				<xsl:if test="contains($String, $Separator)">
					<xsl:call-template name="GetStringToken">
						<xsl:with-param name="String" select="substring-after($String, $Separator)"/>
						<xsl:with-param name="Separator" select="$Separator"/>
						<xsl:with-param name="Index" select="$Index - 1"/>
					</xsl:call-template>
				</xsl:if>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="substring-before($String, $Separator)"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:key name="CheckForType1or2" match="/eBay/Characteristics/CharacteristicsSet/CharacteristicsList/*/*" use="concat(../../../@id,':',EditType, ':', @id)"/>
	<xsl:key name="CheckForType1or2New" match="/eBay/Characteristics/CharacteristicsSet/CharacteristicsList/*/*[EditType = 1 or EditType = 2]" use="concat(../../../@id,':', @id)"/>
	<!-- MS: In the next 4 keys I have added support for the new CategoryMapping model, while still keeping support for old model.  -->
	<xsl:key name="CheckForSource" match="/eBay/Attributes/AttributeSet/Attribute[@source] | /eBay/Attributes/CategoryMappingDetails/CategoryMapping/AttributeSet/Attribute[@source]" use=" concat(../@id,':',@id)"/>
	<xsl:key name="CheckForUserSource" match="/eBay/Attributes/AttributeSet/Attribute[@source = 0] | /eBay/Attributes/CategoryMappingDetails/CategoryMapping/AttributeSet/Attribute[@source = 0]" use=" concat(../@id,':',@id)"/>
	<xsl:key name="CheckForSource1and3" match="/eBay/Attributes/AttributeSet/Attribute[@source=1 or @source=3] | /eBay/Attributes/CategoryMappingDetails/CategoryMapping/AttributeSet/Attribute[@source=1 or @source=3]" use="concat(../@id, ':', @id)"/>
	<xsl:key name="CheckForAttributeWithValue" match="/eBay/Attributes/AttributeSet/Attribute/Value[@id != -10 and ((Name and Name != '') or (DisplayName and DisplayName != '') or (SellingDisplayName and SellingDisplayName != '') or (DateString and DateString != ''))] | /eBay/Attributes/CategoryMappingDetails/CategoryMapping/AttributeSet/Attribute/Value[@id != -10 and ((Name and Name != '') or (DisplayName and DisplayName != '') or (SellingDisplayName and SellingDisplayName != '') or (DateString and DateString != ''))]" use="concat(../../@id,':',../@id)"/>
	<xsl:template name="Attributes">
		<xsl:param name="showDefault" select="false()"/>
		<xsl:for-each select="$CharacteristicsSets[not(@type='SiteWide')]/PresentationInstruction">
			<xsl:variable name="VCSID" select="../@id"/>
			<xsl:variable name="categoryOldId" select="$selectedSets[@id=$VCSID]/@categoryOldId"/>
			<xsl:variable name="categoryId" select="$selectedSets[@id=$VCSID]/@categoryId"/>
			<xsl:variable name="InitialFlowXpath" select="$CharacteristicsSets[@id = $VCSID]/CharacteristicsList/*/Attribute"/>
			<xsl:variable name="selectedSetByVcs" select="$selectedSets[@id = $VCSID]"/>
		<table border="0" cellpadding="3" cellspacing="0">
				<tr>
					<xsl:if test="$StockPhotoURL != ''">
						<td align="left" valign="top">
							<img src="{$StockPhotoURL}"/>
						</td>
					</xsl:if>
					<td align="left">
			<input type="hidden" name="vcsid" value="{$VCSID}"/>
			<xsl:call-template name="PromoMessage"><xsl:with-param name="Message" select="../PromoTop"/></xsl:call-template>
			<xsl:choose>
				<xsl:when test="$selectedSetByVcs and not($showDefault)">
					<xsl:call-template name="BuildPresentationInstructions">
						<xsl:with-param name="PI" select="Initial"/>
						<xsl:with-param name="PI.Conditional" select="Conditional"/>
						<xsl:with-param name="CurrentAttributeXPath" select="$InitialFlowXpath"/>
						<!--  MS: Changed the definition of SelectedAttributeXPath to use the CategoryMapping model when available. A complex mapping of old categories ids and 
						new, while still being backwards compatible. -->
						<xsl:with-param name="SelectedAttributeXPath" select="$selectedSetByVcs/Attribute | $categories[(not($categoryId) and not(parent::CategoryMapping) and @id = $VCSID) or (@id=$VCSID and $categoryId=../@id and not($categoryOldId) and not(../@oldId)) or (@id=$VCSID and $categoryOldId=../@oldId and $categoryId=../@id)]/Attribute[not($selectedSetByVcs/Attribute) or key('CheckForSource1and3', concat(../@id,':',@id)) and key('CheckForType1or2New', concat(../@id,':',@id))]"/>
						<xsl:with-param name="VCSID" select="$VCSID"/>
					</xsl:call-template>
				</xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="BuildPresentationInstructions">
						<xsl:with-param name="PI" select="Initial"/>
						<xsl:with-param name="PI.Conditional" select="Conditional"/>
						<xsl:with-param name="CurrentAttributeXPath" select="$InitialFlowXpath"/>
						<!--  MS: Changed the definition of SelectedAttributeXPath to use the CategoryMapping model when available. A complex mapping of old categories ids and 
						new, while still being backwards compatible. -->
						<xsl:with-param name="SelectedAttributeXPath" select="$categories[(not($categoryId) and not(parent::CategoryMapping) and @id = $VCSID) or (@id=$VCSID and $categoryId=../@id and not($categoryOldId) and not(../@oldId)) or (@id=$VCSID and $categoryOldId=../@oldId and $categoryId=../@id)]/Attribute"/>
						<xsl:with-param name="VCSID" select="$VCSID"/>
					</xsl:call-template>
				</xsl:otherwise>
			</xsl:choose>
			<xsl:call-template name="PromoMessage"><xsl:with-param name="Message" select="../PromoBottom"/></xsl:call-template>
					</td>
				</tr>
		</table>
		</xsl:for-each>
		<xsl:if test="$CharacteristicsSets[@type='SiteWide']">
			<table border="0" cellpadding="3" cellspacing="0">
					<tr>
						<xsl:if test="$StockPhotoURL != ''">
							<td align="left" valign="top">
								<img src="{$StockPhotoURL}"/>
							</td>
						</xsl:if>
						<td align="left">
						  <xsl:if test="$subPage != 'API' ">
							<xsl:call-template name="PromoMessage">
								<xsl:with-param name="Message">
									<xsl:choose>
										<xsl:when test="$CharacteristicsSets[not(@type='SiteWide')]">Additional Item Specifics</xsl:when>
										<xsl:otherwise>Item Specifics</xsl:otherwise>
									</xsl:choose>
								</xsl:with-param>
							</xsl:call-template>
						  </xsl:if>
							<xsl:for-each select="$CharacteristicsSets[@type='SiteWide']/PresentationInstruction">
								<xsl:variable name="VCSID" select="../@id"/>
								<xsl:variable name="categoryOldId" select="$selectedSets[@id=$VCSID]/@categoryOldId"/>
								<xsl:variable name="categoryId" select="$selectedSets[@id=$VCSID]/@categoryId"/>
								<xsl:variable name="InitialFlowXpath" select="$CharacteristicsSets[@id = $VCSID]/CharacteristicsList/*/Attribute"/>
								<xsl:variable name="selectedSetByVcs" select="$selectedSets[@id = $VCSID]"/>
								<input type="hidden" name="vcsid" value="{$VCSID}"/>
								<xsl:choose>
									<xsl:when test="$selectedSetByVcs ">
										<xsl:call-template name="BuildPresentationInstructions">
											<xsl:with-param name="PI" select="Initial"/>
											<xsl:with-param name="PI.Conditional" select="Conditional"/>
											<xsl:with-param name="CurrentAttributeXPath" select="$InitialFlowXpath"/>
											<!--  MS: Changed the definition of SelectedAttributeXPath to use the CategoryMapping model when available. A complex mapping of old categories ids and 
											new, while still being backwards compatible. -->
											<xsl:with-param name="SelectedAttributeXPath" select="$selectedSetByVcs/Attribute | $categories[(not($categoryId) and not(parent::CategoryMapping) and @id = $VCSID) or (@id=$VCSID and $categoryId=../@id and not($categoryOldId) and not(../@oldId)) or (@id=$VCSID and $categoryOldId=../@oldId and $categoryId=../@id)]/Attribute[not($selectedSetByVcs/Attribute) or key('CheckForSource1and3', concat(../@id,':',@id)) and key('CheckForType1or2New', concat(../@id,':',@id))]"/>
											<xsl:with-param name="VCSID" select="$VCSID"/>
										</xsl:call-template>
									</xsl:when>
									<xsl:otherwise>
										<xsl:call-template name="BuildPresentationInstructions">
											<xsl:with-param name="PI" select="Initial"/>
											<xsl:with-param name="PI.Conditional" select="Conditional"/>
											<xsl:with-param name="CurrentAttributeXPath" select="$InitialFlowXpath"/>
											<!--  MS: Changed the definition of SelectedAttributeXPath to use the CategoryMapping model when available. A complex mapping of old categories ids and 
											new, while still being backwards compatible. -->
											<xsl:with-param name="SelectedAttributeXPath" select="$categories[(not($categoryId) and not(parent::CategoryMapping) and @id = $VCSID) or (@id=$VCSID and $categoryId=../@id and not($categoryOldId) and not(../@oldId)) or (@id=$VCSID and $categoryOldId=../@oldId and $categoryId=../@id)]/Attribute"/>
											<xsl:with-param name="VCSID" select="$VCSID"/>
										</xsl:call-template>
									</xsl:otherwise>
								</xsl:choose>
							</xsl:for-each>
						</td>
					</tr>
			</table>
		</xsl:if>
	</xsl:template>

	<xsl:template name="Recommendations">
		<xsl:param name="attrId"/>
		<xsl:param name="VCSID"/>
		<xsl:param name="SelectedAttributeXPath"/>
		<xsl:for-each select="$RootNode/Recommendations/Attributes/AttributeSet[@id=$VCSID]/Attribute[@id=$attrId]">
			<select name="attr_t{../@id}_{@id}">
				<option value="{Value/ValueLiteral}"><xsl:value-of select="Value/ValueLiteral"/></option>
				<xsl:apply-templates select="Value/SuggestedValueLiteral"><xsl:with-param name="selectedValue" select="$SelectedAttributeXPath[@id=$attrId]/Value/Name"/></xsl:apply-templates>
			</select>
		</xsl:for-each>
	</xsl:template>
	<xsl:template match="SuggestedValueLiteral">
		<option value="{.}"><xsl:value-of select="."/></option>
	</xsl:template>
	<xsl:template match="/">
		<xsl:choose>
			<xsl:when test="$API.Overrides/Show/ItemSpecificsOnly ">
				<xsl:copy-of select="$API.Overrides/Styles/Head/node()"/>
				<xsl:call-template name="ItemSpecifics"/>
			</xsl:when>
			<xsl:otherwise>
				<head>
					<title/>
					<xsl:copy-of select="$API.Overrides/Styles/Head/node()"/>
				</head>
				<body bgcolor="white">
					<xsl:copy-of select="$API.Overrides/Styles/Background/@*"/>
					<form action="AttrPage" name="{$formName}" id="{$formName}" method="post">
						<xsl:call-template name="ItemSpecifics"/>
					</form>
				</body>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
	<xsl:template name="escapeQuot">
		<xsl:param name="text" />
		<xsl:param name="quot">&quot;</xsl:param>
		
		<xsl:choose>
			<xsl:when test="contains($text, $quot)">
				<xsl:variable name="bufferBefore" select="substring-before($text,$quot)" />
				<xsl:variable name="newBuffer" select="substring-after($text,$quot)" />
				<xsl:value-of select="concat($bufferBefore,'\',$quot)" />
				<xsl:call-template name="escapeQuot">
					<xsl:with-param name="text" select="$newBuffer" />
					<xsl:with-param name="quot" select="$quot" />
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$text" />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
</xsl:stylesheet>
